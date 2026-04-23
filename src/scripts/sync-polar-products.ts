import "reflect-metadata";
import { config } from "dotenv";
import { resolve } from "path";
import { AppDataSource } from "../infrastructure/database/data-source";
import { ServiceEntity } from "../infrastructure/database/entities/service.entity";
import { Polar } from "@polar-sh/sdk";
import {
  SUPPORTED_CURRENCIES,
  POLAR_DEFAULT_CURRENCY,
  isSupportedCurrency,
} from "../shared/constants/currencies";

config({ path: resolve(__dirname, "../../.env") });

function buildPolarPrices(service: ServiceEntity): {
  amountType: "fixed";
  priceAmount: number;
  priceCurrency: string;
}[] {
  const source = Array.isArray(service.prices) ? service.prices : [];

  const normalized = source
    .map((p: any) => ({
      currency: String(p?.currency ?? "").toUpperCase(),
      amount: Number(p?.amount),
    }))
    .filter(
      (p) =>
        isSupportedCurrency(p.currency) &&
        Number.isFinite(p.amount) &&
        p.amount > 0,
    );

  // Legacy fallback
  if (normalized.length === 0 && Number(service.price) > 0) {
    const legacyCurrency = (service.currency || "USD").toUpperCase();
    if (isSupportedCurrency(legacyCurrency)) {
      normalized.push({
        currency: legacyCurrency,
        amount: Number(service.price),
      });
    }
  }

  const hasUsd = normalized.some((p) => p.currency === POLAR_DEFAULT_CURRENCY);
  if (!hasUsd && Number(service.price) > 0) {
    normalized.unshift({
      currency: POLAR_DEFAULT_CURRENCY,
      amount: Number(service.price),
    });
  }

  const seen = new Set<string>();
  const ordered = [...SUPPORTED_CURRENCIES].flatMap((code) => {
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
 * One-off backfill: walk every row in `services` and make sure it has a
 * matching Polar Product. Run after switching to Polar so that existing
 * services (that were created before the adapter landed) get a product id.
 *
 *   npm run sync:polar
 *
 * Safe to re-run; idempotent. Services that already have polar_product_id
 * are updated in place; services without one get a fresh product.
 */
async function main() {
  const server = (process.env.POLAR_SERVER ?? "sandbox") as
    | "sandbox"
    | "production";
  const accessToken = process.env.POLAR_ACCESS_TOKEN ?? "";
  const organizationId = process.env.POLAR_ORGANIZATION_ID;
  // Polar Organization Access Tokens (OATs) reject requests that include
  // `organization_id`. Only pass it when an explicit opt-in is set
  // (i.e. when you're using a user-access token instead of an OAT).
  const sendOrgId = process.env.POLAR_SEND_ORGANIZATION_ID === "true";

  if (!accessToken) {
    // Don't fail the build/deploy — the sync is optional until Polar creds exist.
    console.warn("[sync:polar] Skipped: POLAR_ACCESS_TOKEN not set.");
    return;
  }

  const polar = new Polar({ server, accessToken });

  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(ServiceEntity);

  try {
    const services = await repo.find();
    console.log(
      `Syncing ${services.length} service(s) to Polar (${server})...`,
    );

    for (const service of services) {
      const name =
        service.title?.en || service.title?.ar || `Service ${service.id}`;
      const description = [service.description?.en, service.description?.ar]
        .filter(Boolean)
        .join("\n\n");
      const polarPrices = buildPolarPrices(service);

      if (polarPrices.length === 0) {
        console.warn(
          `  ~ skipped service ${service.id}: no valid prices (USD entry required)`,
        );
        continue;
      }

      try {
        if (!service.polarProductId) {
          const created: any = await polar.products.create({
            ...(sendOrgId && organizationId ? { organizationId } : {}),
            name,
            description: description || undefined,
            recurringInterval: null,
            prices: polarPrices,
          } as any);
          service.polarProductId = created?.id ?? null;
          await repo.save(service);
          console.log(
            `  + created ${created?.id} for service ${service.id} [${polarPrices.map((p) => p.priceCurrency).join(", ")}]`,
          );
        } else {
          await polar.products.update({
            id: service.polarProductId,
            productUpdate: {
              name,
              description: description || undefined,
            },
          } as any);
          console.log(
            `  = updated ${service.polarProductId} for service ${service.id} (prices overridden per-checkout)`,
          );
        }
      } catch (err: any) {
        console.error(
          `  ! failed for service ${service.id}: ${err?.message ?? err}`,
        );
      }
    }

    console.log("Done.");
  } finally {
    await AppDataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
