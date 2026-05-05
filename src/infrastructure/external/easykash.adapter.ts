import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { parse as parseQs } from "querystring";
import {
  PaymentGatewayPort,
  InitiatePaymentDto,
  PaymentGatewayResponse,
  WebhookPayload,
  ParsedWebhookEvent,
} from "../../domain/payment/ports/payment-gateway.port";
import { PaymentRepositoryPort } from "../../domain/payment/ports/payment.repository.port";
import { isEasyKashChargeable } from "../../shared/constants/currencies";

const DEFAULT_API_BASE = "https://back.easykash.net/api";

/**
 * HMAC field order per EasyKash callback verification docs.
 */
const CALLBACK_HMAC_KEYS = [
  "ProductCode",
  "Amount",
  "ProductType",
  "PaymentMethod",
  "status",
  "easykashRef",
  "customerReference",
] as const;

/** Deterministic safe integer for EasyKash `customerReference` (UUID cannot be sent as-is). */
export function orderIdToEasyKashCustomerReference(orderId: string): number {
  const buf = createHash("sha256").update(orderId, "utf8").digest();
  let n = 0n;
  for (let i = 0; i < 7; i++) {
    n = (n << 8n) | BigInt(buf[i]);
  }
  const cap = BigInt(Number.MAX_SAFE_INTEGER);
  const mod = cap > 0n ? (n % cap) + 1n : 1n;
  return Number(mod);
}

@Injectable()
export class EasyKashAdapter implements PaymentGatewayPort {
  readonly id = "easykash";
  private readonly logger = new Logger(EasyKashAdapter.name);
  private readonly http: AxiosInstance;

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentRepository: PaymentRepositoryPort,
  ) {
    const baseURL =
      this.configService.get<string>("EASYKASH_API_BASE") ?? DEFAULT_API_BASE;
    this.http = axios.create({
      baseURL,
      timeout: 20000,
      headers: { "Content-Type": "application/json" },
    });
  }

  async initiatePayment(
    dto: InitiatePaymentDto,
  ): Promise<PaymentGatewayResponse> {
    const apiKey = this.configService.get<string>("EASYKASH_API_KEY");
    if (!apiKey) {
      throw new InternalServerErrorException(
        "EASYKASH_API_KEY is not configured",
      );
    }

    const currency = String(dto.currency || "EGP").toUpperCase();
    if (!isEasyKashChargeable(currency)) {
      throw new BadRequestException(
        `Currency ${currency} is not enabled for EasyKash`,
      );
    }

    const paymentOptions = this.parsePaymentOptions();
    if (paymentOptions.length === 0) {
      throw new InternalServerErrorException(
        "EASYKASH_PAYMENT_OPTIONS must list at least one payment option id",
      );
    }

    const amount = Number(dto.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException("Invalid payment amount");
    }

    const customerReference = orderIdToEasyKashCustomerReference(dto.orderId);
    const refStr = String(customerReference);

    const cashExpiryRaw = this.configService.get<string>(
      "EASYKASH_CASH_EXPIRY_HOURS",
    );
    const cashExpiry =
      cashExpiryRaw != null && cashExpiryRaw.trim() !== ""
        ? Number(cashExpiryRaw)
        : undefined;

    const body: Record<string, unknown> = {
      amount,
      currency,
      paymentOptions,
      name: this.trimName(dto.customerName),
      email: dto.customerEmail?.trim() || "donor@khairat.local",
      mobile: this.normalizeMobile(dto.customerPhone),
      redirectUrl: dto.returnUrl,
      customerReference,
    };
    if (cashExpiry != null && Number.isFinite(cashExpiry) && cashExpiry > 0) {
      body.cashExpiry = cashExpiry;
    }

    this.logger.log(
      `EasyKash Direct Pay initiate order=${dto.orderId} ref=${refStr} ${amount} ${currency}`,
    );

    let data: any;
    try {
      const res = await this.http.post("/directpayv1/pay", body, {
        headers: { authorization: apiKey },
      });
      data = res.data;
    } catch (error: any) {
      const detail = error?.response?.data ?? error?.message ?? error;
      this.logger.error(`EasyKash pay failed: ${JSON.stringify(detail)}`);
      throw new BadRequestException("EasyKash payment initiation failed");
    }

    const redirectUrl: string | undefined =
      data?.redirectUrl ?? data?.redirect_url;
    if (!redirectUrl || typeof redirectUrl !== "string") {
      throw new InternalServerErrorException(
        "EasyKash did not return a redirectUrl",
      );
    }

    const productCode = this.extractProductCodeFromRedirectUrl(redirectUrl);
    const transactionId = productCode ?? refStr;

    return {
      transactionId,
      redirectUrl,
      status: "INITIATED",
      rawResponse: data,
      gatewayCustomerReference: refStr,
    };
  }

  async verifyAndParseEvent(
    body: Buffer,
    _headers: Record<string, string | string[] | undefined>,
    _query: Record<string, string>,
  ): Promise<ParsedWebhookEvent> {
    const secret = this.configService.get<string>("EASYKASH_HMAC_SECRET");
    if (!secret) {
      throw new InternalServerErrorException(
        "EASYKASH_HMAC_SECRET is not configured",
      );
    }

    const payload = this.parseWebhookBody(body);

    const received = String(payload?.signatureHash ?? "")
      .trim()
      .toLowerCase();
    if (!received) {
      throw new BadRequestException("Missing EasyKash signatureHash");
    }

    const concat = CALLBACK_HMAC_KEYS.map((k) => String(payload[k] ?? "")).join(
      "",
    );
    const computed = createHmac("sha512", secret)
      .update(concat, "utf8")
      .digest("hex")
      .toLowerCase();

    if (
      computed.length !== received.length ||
      !timingSafeEqual(
        Buffer.from(computed, "hex"),
        Buffer.from(received, "hex"),
      )
    ) {
      this.logger.warn("Invalid EasyKash callback signature");
      throw new BadRequestException("Invalid webhook signature");
    }

    const refRaw = payload?.customerReference;
    const refStr =
      refRaw === undefined || refRaw === null ? "" : String(refRaw).trim();

    let orderId: string | null = null;
    if (refStr) {
      const payment =
        await this.paymentRepository.findByGatewayCustomerReference(refStr);
      orderId = payment?.orderId ?? null;
    }

    const statusUpper = String(payload?.status ?? "").toUpperCase();
    let outcome: "SUCCESS" | "FAILED" | "IGNORE" = "IGNORE";
    if (statusUpper === "PAID") {
      outcome = "SUCCESS";
    } else if (
      ["FAILED", "EXPIRED", "CANCELED", "REFUNDED"].some((s) =>
        statusUpper.includes(s),
      )
    ) {
      outcome = "FAILED";
    }

    const transactionId =
      payload?.easykashRef != null ? String(payload.easykashRef) : null;

    if (!orderId) {
      this.logger.warn(
        `EasyKash callback: unknown customerReference=${refStr}`,
      );
      return {
        outcome: "IGNORE",
        orderId: null,
        transactionId,
        raw: payload,
      };
    }

    return {
      outcome,
      orderId,
      transactionId,
      raw: payload,
    };
  }

  /**
   * Payment Inquiry uses `customerReference` (same ref sent to Direct Pay).
   * Pass the persisted gateway reference string, not `easykashRef`.
   */
  async getTransactionStatus(transactionId: string): Promise<WebhookPayload> {
    const apiKey = this.configService.get<string>("EASYKASH_API_KEY");
    if (!apiKey) {
      throw new InternalServerErrorException(
        "EASYKASH_API_KEY is not configured",
      );
    }

    try {
      const res = await this.http.post(
        "/cash-api/inquire",
        { customerReference: transactionId },
        { headers: { authorization: apiKey } },
      );
      const obj = res.data ?? {};
      const statusUpper = String(obj?.status ?? "").toUpperCase();
      const paid = statusUpper === "PAID" || statusUpper === "DELIVERED";
      const payment =
        await this.paymentRepository.findByGatewayCustomerReference(
          transactionId,
        );
      return {
        transactionId: String(obj?.easykashRef ?? transactionId),
        orderId: payment?.orderId ?? "",
        status: paid ? "SUCCESS" : "FAILED",
        amount: Number(obj?.Amount ?? obj?.amount ?? 0),
        signature: "",
        rawPayload: obj,
      };
    } catch (error: any) {
      this.logger.error(`EasyKash inquire failed: ${error?.message ?? error}`);
      throw error;
    }
  }

  private parsePaymentOptions(): number[] {
    const raw =
      this.configService.get<string>("EASYKASH_PAYMENT_OPTIONS") ?? "";
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n > 0);
  }

  private trimName(full: string | undefined): string {
    const t = (full ?? "").trim();
    return t.length > 0 ? t : "Donor";
  }

  private normalizeMobile(phone: string | undefined): string {
    const digits = String(phone ?? "").replace(/\D/g, "");
    return digits.length > 0 ? digits : "01000000000";
  }

  private extractProductCodeFromRedirectUrl(url: string): string | null {
    try {
      const m = url.match(/DirectPayV1\/([^/?#]+)/i);
      return m?.[1] ?? null;
    } catch {
      return null;
    }
  }

  private parseWebhookBody(body: Buffer): Record<string, any> {
    if (!body || body.length === 0) {
      return {};
    }

    const raw = body.toString("utf8").trim();
    if (!raw) return {};

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed as Record<string, any>;
      }
    } catch {
      // Not JSON; fallback to url-encoded payload parsing.
    }

    const asQuery = parseQs(raw);
    if (Object.keys(asQuery).length > 0) {
      return asQuery as Record<string, any>;
    }

    throw new BadRequestException("Invalid EasyKash callback body");
  }
}
