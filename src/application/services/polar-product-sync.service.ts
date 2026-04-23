import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Polar } from "@polar-sh/sdk";
import { Service } from "../../domain/service/entities/service.entity";
import {
  POLAR_CHARGEABLE_CURRENCIES,
  POLAR_DEFAULT_CURRENCY,
  isPolarChargeable,
} from "../../shared/constants/currencies";

function formatPolarError(error: any): string {
  if (!error) return "Unknown Polar error";
  const detail = error.body$ ?? error.response?.data ?? null;
  if (typeof detail === "string") return detail;
  if (detail) {
    try {
      const parsed = typeof detail === "string" ? JSON.parse(detail) : detail;
      const first = Array.isArray(parsed?.detail) ? parsed.detail[0] : null;
      if (first?.msg) {
        const loc = Array.isArray(first.loc) ? first.loc.join(".") : "";
        return loc ? `${loc}: ${first.msg}` : first.msg;
      }
      return JSON.stringify(parsed);
    } catch {
      return String(detail);
    }
  }
  return error.message ?? String(error);
}

/**
 * Keeps every local `Service` mirrored as a Polar Product so the PolarAdapter
 * can reference a valid `productId` when creating checkout sessions.
 *
 * `syncService` throws when it fails to CREATE a product (the admin needs to
 * see the Polar rejection reason in the dashboard). Updates of an existing
 * product are best-effort - they log but do not throw so a transient Polar
 * outage cannot block routine edits.
 */
@Injectable()
export class PolarProductSyncService {
  private readonly logger = new Logger(PolarProductSyncService.name);
  private readonly polar: Polar;
  private readonly organizationId: string | undefined;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const server = (this.config.get<string>("POLAR_SERVER") ?? "sandbox") as
      | "sandbox"
      | "production";
    const accessToken = this.config.get<string>("POLAR_ACCESS_TOKEN") ?? "";
    this.organizationId = this.config.get<string>("POLAR_ORGANIZATION_ID");
    this.enabled = Boolean(accessToken && this.organizationId);

    this.polar = new Polar({ server, accessToken });

    if (!this.enabled) {
      this.logger.warn(
        "Polar sync disabled: POLAR_ACCESS_TOKEN and/or POLAR_ORGANIZATION_ID not set",
      );
    }
  }

  /**
   * Create the Polar Product if it doesn't exist, otherwise update it.
   * Returns the resulting Polar product id (or null on failure / disabled).
   */
  async syncService(service: Service): Promise<string | null> {
    if (!this.enabled) return service.polarProductId ?? null;

    const name =
      service.title?.en || service.title?.ar || `Service ${service.id}`;
    const description = [service.description?.en, service.description?.ar]
      .filter(Boolean)
      .join("\n\n");

    const polarPrices = this.buildPolarPrices(service);
    if (polarPrices.length === 0) {
      this.logger.warn(
        `Polar sync skipped for service ${service.id}: no valid prices (USD entry required)`,
      );
      return service.polarProductId ?? null;
    }

    if (!service.polarProductId) {
      // Polar Organization Access Tokens (OATs) are already scoped to one
      // org — the API rejects requests that include `organization_id`
      // alongside an OAT. Only include it when explicitly configured AND
      // the token is not an OAT (set POLAR_SEND_ORGANIZATION_ID=true to
      // force it for user-access tokens).
      const sendOrgId =
        this.config.get<string>("POLAR_SEND_ORGANIZATION_ID") === "true";
      try {
        const created: any = await this.polar.products.create({
          ...(sendOrgId && this.organizationId
            ? { organizationId: this.organizationId }
            : {}),
          name,
          description: description || undefined,
          recurringInterval: null,
          prices: polarPrices,
        } as any);
        this.logger.log(
          `Polar product created for service ${service.id}: ${created?.id} with currencies [${polarPrices.map((p) => p.priceCurrency).join(", ")}]`,
        );
        return created?.id ?? null;
      } catch (error: any) {
        const detail = formatPolarError(error);
        this.logger.error(
          `Polar product create failed for service ${service.id}: ${detail}`,
        );
        throw new BadRequestException(`Polar rejected the product: ${detail}`);
      }
    }

    // Polar does not allow mutating the amount on an existing fixed price,
    // so we only refresh name/description here. The PolarAdapter overrides
    // prices per-checkout with the current service.prices, so the charged
    // amount is always live even when the catalog entry drifts.
    try {
      await this.polar.products.update({
        id: service.polarProductId,
        productUpdate: {
          name,
          description: description || undefined,
        },
      } as any);
      this.logger.log(
        `Polar product updated for service ${service.id}: ${service.polarProductId} (prices overridden per-checkout)`,
      );
      return service.polarProductId;
    } catch (error: any) {
      this.logger.error(
        `Polar product update failed for service ${service.id}: ${formatPolarError(error)}`,
      );
      return service.polarProductId;
    }
  }

  /**
   * Convert `service.prices` into Polar's fixed-price payload.
   * Sends every currency the service was priced in that is also allowed
   * by Polar (all SUPPORTED_CURRENCIES by default; narrow via the
   * POLAR_CHARGEABLE_CURRENCIES env var if Polar rejects a particular one).
   * Guarantees the USD entry is present (Polar requires the org's default
   * presentment currency in every product's price list).
   */
  private buildPolarPrices(
    service: Service,
  ): { amountType: "fixed"; priceAmount: number; priceCurrency: string }[] {
    const source = Array.isArray(service.prices) ? service.prices : [];

    const normalized = source
      .map((p) => ({
        currency: String(p.currency ?? "").toUpperCase(),
        amount: Number(p.amount),
      }))
      .filter(
        (p) =>
          isPolarChargeable(p.currency) &&
          Number.isFinite(p.amount) &&
          p.amount > 0,
      );

    // Legacy fallback: if no prices array, synthesize from the old columns.
    if (normalized.length === 0 && Number(service.price) > 0) {
      const legacyCurrency = (service.currency || "USD").toUpperCase();
      if (isPolarChargeable(legacyCurrency)) {
        normalized.push({
          currency: legacyCurrency,
          amount: Number(service.price),
        });
      }
    }

    // Ensure USD is in the set (add it using the legacy price or the USD entry
    // from service.prices if the filtered list somehow dropped it).
    const hasUsd = normalized.some(
      (p) => p.currency === POLAR_DEFAULT_CURRENCY,
    );
    if (!hasUsd) {
      const usdFromPrices = source.find(
        (p) =>
          String(p.currency ?? "").toUpperCase() === POLAR_DEFAULT_CURRENCY,
      );
      const fallback = Number(usdFromPrices?.amount ?? service.price);
      if (Number.isFinite(fallback) && fallback > 0) {
        normalized.unshift({
          currency: POLAR_DEFAULT_CURRENCY,
          amount: fallback,
        });
      }
    }

    // De-duplicate by currency (keep first occurrence), preserve chargeable order.
    const seen = new Set<string>();
    const ordered = [...POLAR_CHARGEABLE_CURRENCIES].flatMap((code) => {
      const entry = normalized.find((p) => p.currency === code);
      if (!entry || seen.has(code)) return [];
      seen.add(code);
      return [entry];
    });

    return ordered.map((p) => ({
      amountType: "fixed" as const,
      priceAmount: Math.round(p.amount * 100),
      priceCurrency: p.currency.toLowerCase(),
    }));
  }

  /**
   * Archive the Polar product. Polar doesn't truly delete paid products, so
   * archiving is the correct operation. Safe to call with null/unknown id.
   */
  async archiveService(service: Service): Promise<void> {
    if (!this.enabled) return;
    if (!service.polarProductId) return;

    try {
      await this.polar.products.update({
        id: service.polarProductId,
        productUpdate: { isArchived: true },
      } as any);
      this.logger.log(
        `Polar product archived for service ${service.id}: ${service.polarProductId}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Polar product archive failed for service ${service.id}: ${error?.message ?? error}`,
      );
    }
  }
}
