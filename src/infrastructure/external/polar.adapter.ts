import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Polar } from "@polar-sh/sdk";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  validateEvent,
  WebhookVerificationError,
}: {
  validateEvent: (
    body: Buffer | string,
    headers: Record<string, string | string[] | undefined>,
    secret: string,
  ) => unknown;
  WebhookVerificationError: new (...args: any[]) => Error;
} = require("@polar-sh/sdk/webhooks");
import {
  PaymentGatewayPort,
  InitiatePaymentDto,
  PaymentGatewayResponse,
  WebhookPayload,
  ParsedWebhookEvent,
} from "../../domain/payment/ports/payment-gateway.port";
import { ServiceRepositoryPort } from "../../domain/service/ports/service.repository.port";
import {
  SUPPORTED_CURRENCIES,
  POLAR_DEFAULT_CURRENCY,
  isSupportedCurrency,
  isPolarChargeable,
} from "../../shared/constants/currencies";

@Injectable()
export class PolarAdapter implements PaymentGatewayPort {
  private readonly logger = new Logger(PolarAdapter.name);
  private readonly polar: Polar;

  constructor(
    private readonly configService: ConfigService,
    private readonly serviceRepository: ServiceRepositoryPort,
  ) {
    const server = (this.configService.get<string>("POLAR_SERVER") ??
      "sandbox") as "sandbox" | "production";
    const accessToken = this.configService.get<string>("POLAR_ACCESS_TOKEN");

    this.polar = new Polar({
      server,
      accessToken: accessToken ?? "",
    });
  }

  async initiatePayment(
    dto: InitiatePaymentDto,
  ): Promise<PaymentGatewayResponse> {
    this.logger.log(
      `Initiating Polar checkout for order ${dto.orderId} (service ${dto.serviceId})`,
    );

    const service = await this.serviceRepository.findById(dto.serviceId);
    if (!service) {
      throw new BadRequestException(
        `Service ${dto.serviceId} not found when initiating Polar checkout`,
      );
    }

    const polarProductId = (service as any).polarProductId as string | null;
    if (!polarProductId) {
      throw new BadRequestException(
        `Service ${dto.serviceId} is not yet synced to Polar. Save the service in the dashboard once to create the matching Polar product.`,
      );
    }

    const quantity = Math.max(dto.quantity, 1);
    const requested = String(dto.currency || POLAR_DEFAULT_CURRENCY).toUpperCase();
    if (!isSupportedCurrency(requested)) {
      throw new BadRequestException(
        `Currency ${requested} is not supported by Polar. Allowed: ${SUPPORTED_CURRENCIES.join(", ")}`,
      );
    }

    // Polar only accepts a subset of currencies (USD/EUR/GBP by default).
    // If the customer picked a display-only currency (e.g. EGP, SAR), bill
    // them in USD instead. The order already records the requested currency
    // for display, so the user-facing experience stays local.
    const chargeCurrency = isPolarChargeable(requested)
      ? requested
      : POLAR_DEFAULT_CURRENCY;

    if (chargeCurrency !== requested) {
      this.logger.log(
        `Currency ${requested} is not Polar-chargeable, falling back to ${chargeCurrency} for order ${dto.orderId}`,
      );
    }

    // Build the checkout price override from the service's multi-currency
    // price list, keeping only Polar-chargeable entries (scaled by quantity).
    // Polar requires USD to always be present in any override.
    const servicePrices =
      ((service as any).prices as
        | { currency: string; amount: number }[]
        | undefined) ?? [];

    const overrideMap = new Map<string, number>();
    for (const entry of servicePrices) {
      const code = String(entry.currency || "").toUpperCase();
      if (!isPolarChargeable(code)) continue;
      overrideMap.set(code, Number(entry.amount));
    }

    if (!overrideMap.has(POLAR_DEFAULT_CURRENCY)) {
      // Derive USD from the service's USD price entry, legacy price column,
      // or the order amount when falling back.
      const usdFromPrices = servicePrices.find(
        (p) => String(p.currency || "").toUpperCase() === POLAR_DEFAULT_CURRENCY,
      );
      const usdFallback = Number(
        usdFromPrices?.amount ??
          (service as any).price ??
          dto.amount / quantity,
      );
      overrideMap.set(POLAR_DEFAULT_CURRENCY, usdFallback);
    }

    if (!overrideMap.has(chargeCurrency)) {
      // Service wasn't priced in this currency - bill the dto.amount the
      // frontend showed (assumed already converted into chargeCurrency).
      overrideMap.set(chargeCurrency, dto.amount / quantity);
    }

    const overridePrices = Array.from(overrideMap.entries()).map(
      ([code, unitAmount]) => ({
        amountType: "fixed" as const,
        priceAmount: Math.round(unitAmount * quantity * 100),
        priceCurrency: code.toLowerCase(),
      }),
    );

    try {
      const checkout = await this.polar.checkouts.create({
        products: [polarProductId],
        prices: {
          [polarProductId]: overridePrices,
        } as any,
        // Tell Polar which of the override prices to actually charge.
        currency: chargeCurrency.toLowerCase(),
        externalCustomerId: dto.userId,
        customerEmail: dto.customerEmail,
        customerName: dto.customerName,
        successUrl: dto.returnUrl,
        metadata: {
          orderId: dto.orderId,
          userId: dto.userId,
          serviceId: dto.serviceId,
          quantity: String(quantity),
        },
      } as any);

      return {
        transactionId: (checkout as any).id,
        redirectUrl: (checkout as any).url,
        status: "INITIATED",
        rawResponse: checkout as any,
      };
    } catch (error: any) {
      this.logger.error(
        `Polar checkout creation failed: ${error?.message ?? error}`,
      );
      throw error;
    }
  }

  verifyAndParseEvent(
    body: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): ParsedWebhookEvent {
    const secret = this.configService.get<string>("POLAR_WEBHOOK_SECRET");
    if (!secret) {
      throw new BadRequestException("POLAR_WEBHOOK_SECRET is not configured");
    }

    try {
      const event = validateEvent(body, headers, secret);
      return {
        type: (event as any).type,
        data: (event as any).data,
        raw: event as any,
      };
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        this.logger.warn("Invalid Polar webhook signature");
        throw new BadRequestException("Invalid webhook signature");
      }
      throw error;
    }
  }

  async getTransactionStatus(transactionId: string): Promise<WebhookPayload> {
    try {
      const checkout: any = await this.polar.checkouts.get({
        id: transactionId,
      } as any);

      const orderId =
        (checkout?.metadata as any)?.orderId ?? checkout?.externalCustomerId;
      const succeeded =
        checkout?.status === "succeeded" || checkout?.status === "confirmed";

      return {
        transactionId,
        orderId: orderId ?? "",
        status: succeeded ? "SUCCESS" : "FAILED",
        amount: Number(checkout?.amount ?? 0) / 100,
        signature: "",
        rawPayload: checkout,
      };
    } catch (error: any) {
      this.logger.error(
        `Polar checkout lookup failed: ${error?.message ?? error}`,
      );
      throw error;
    }
  }
}
