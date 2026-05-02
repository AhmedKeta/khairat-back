import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { createHmac, timingSafeEqual } from 'crypto';
import {
  PaymentGatewayPort,
  InitiatePaymentDto,
  PaymentGatewayResponse,
  WebhookPayload,
  ParsedWebhookEvent,
} from '../../domain/payment/ports/payment-gateway.port';
import {
  PAYMOB_DEFAULT_CURRENCY,
  isPaymobChargeable,
} from '../../shared/constants/currencies';

const PAYMOB_HMAC_FIELDS = [
  'amount_cents',
  'created_at',
  'currency',
  'error_occured',
  'has_parent_transaction',
  'id',
  'integration_id',
  'is_3d_secure',
  'is_auth',
  'is_capture',
  'is_refunded',
  'is_standalone_payment',
  'is_voided',
  'order',
  'owner',
  'pending',
  'source_data.pan',
  'source_data.sub_type',
  'source_data.type',
  'success',
] as const;

const DEFAULT_BASE_URL = 'https://accept.paymob.com';

@Injectable()
export class PaymobAdapter implements PaymentGatewayPort {
  readonly id = 'paymob';
  private readonly logger = new Logger(PaymobAdapter.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL =
      this.configService.get<string>('PAYMOB_BASE_URL') ?? DEFAULT_BASE_URL;
    this.http = axios.create({
      baseURL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async initiatePayment(
    dto: InitiatePaymentDto,
  ): Promise<PaymentGatewayResponse> {
    const secretKey = this.configService.get<string>('PAYMOB_SECRET_KEY');
    const publicKey = this.configService.get<string>('PAYMOB_PUBLIC_KEY');
    if (!secretKey || !publicKey) {
      throw new InternalServerErrorException(
        'PAYMOB_SECRET_KEY and PAYMOB_PUBLIC_KEY must be configured',
      );
    }

    const integrationIds = this.parseIntegrationIds();
    if (integrationIds.length === 0) {
      throw new InternalServerErrorException(
        'PAYMOB_INTEGRATION_IDS must list at least one integration ID',
      );
    }

    const requestedCurrency = String(
      dto.currency || PAYMOB_DEFAULT_CURRENCY,
    ).toUpperCase();
    if (!isPaymobChargeable(requestedCurrency)) {
      throw new BadRequestException(
        `Currency ${requestedCurrency} is not chargeable by Paymob`,
      );
    }

    const amountCents = Math.round(Number(dto.amount) * 100);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      throw new BadRequestException('Invalid payment amount');
    }

    const { firstName, lastName } = this.splitName(dto.customerName);
    const baseURL =
      this.configService.get<string>('PAYMOB_BASE_URL') ?? DEFAULT_BASE_URL;

    const payload = {
      amount: amountCents,
      currency: requestedCurrency,
      payment_methods: integrationIds,
      items: [
        {
          name: `Order ${dto.orderId}`,
          amount: amountCents,
          description: `Khairat order ${dto.orderId}`,
          quantity: 1,
        },
      ],
      billing_data: {
        first_name: firstName,
        last_name: lastName,
        email: dto.customerEmail || 'donor@khairat.local',
        phone_number: dto.customerPhone || 'NA',
        country: dto.customerCountry || 'EG',
        apartment: 'NA',
        floor: 'NA',
        street: 'NA',
        building: 'NA',
        shipping_method: 'NA',
        postal_code: 'NA',
        city: 'NA',
        state: 'NA',
      },
      special_reference: dto.orderId,
      extras: {
        orderId: dto.orderId,
        userId: dto.userId,
        serviceId: dto.serviceId,
      },
      notification_url: dto.webhookUrl,
      redirection_url: dto.returnUrl,
    };

    this.logger.log(
      `Creating Paymob intention for order ${dto.orderId} (${amountCents} ${requestedCurrency})`,
    );

    let response: any;
    try {
      const res = await this.http.post('/v1/intention/', payload, {
        headers: { Authorization: `Token ${secretKey}` },
      });
      response = res.data;
    } catch (error: any) {
      const detail = error?.response?.data ?? error?.message ?? error;
      this.logger.error(
        `Paymob intention creation failed: ${JSON.stringify(detail)}`,
      );
      throw new BadRequestException('Paymob intention creation failed');
    }

    const clientSecret: string | undefined = response?.client_secret;
    if (!clientSecret) {
      throw new InternalServerErrorException(
        'Paymob did not return a client_secret',
      );
    }

    const transactionId =
      response?.id ??
      response?.intention_order_master?.id ??
      response?.intention_id ??
      '';

    const redirectUrl = `${baseURL.replace(
      /\/$/,
      '',
    )}/unifiedcheckout/?publicKey=${encodeURIComponent(
      publicKey,
    )}&clientSecret=${encodeURIComponent(clientSecret)}`;

    return {
      transactionId: String(transactionId),
      redirectUrl,
      status: 'INITIATED',
      rawResponse: response,
    };
  }

  async verifyAndParseEvent(
    body: Buffer,
    _headers: Record<string, string | string[] | undefined>,
    query: Record<string, string>,
  ): Promise<ParsedWebhookEvent> {
    const hmacSecret = this.configService.get<string>('PAYMOB_HMAC_SECRET');
    if (!hmacSecret) {
      throw new InternalServerErrorException(
        'PAYMOB_HMAC_SECRET is not configured',
      );
    }

    const receivedHmac = String(query?.hmac ?? '').trim();
    if (!receivedHmac) {
      this.logger.warn('Paymob webhook missing hmac query parameter');
      throw new BadRequestException('Missing webhook signature');
    }

    let parsed: any;
    try {
      parsed = body && body.length > 0 ? JSON.parse(body.toString('utf8')) : {};
    } catch {
      throw new BadRequestException('Invalid Paymob webhook body');
    }

    const obj: Record<string, any> = parsed?.obj ?? parsed ?? {};
    const flat: Record<string, any> = {
      ...obj,
      id: obj?.id,
      order: obj?.order?.id ?? obj?.order,
    };

    const concat = PAYMOB_HMAC_FIELDS.map((f) =>
      this.pickField(flat, f),
    ).join('');
    const computed = createHmac('sha512', hmacSecret)
      .update(concat, 'utf8')
      .digest('hex');

    if (
      computed.length !== receivedHmac.length ||
      !timingSafeEqual(
        Buffer.from(computed, 'hex'),
        Buffer.from(receivedHmac, 'hex'),
      )
    ) {
      this.logger.warn('Invalid Paymob webhook signature');
      throw new BadRequestException('Invalid webhook signature');
    }

    const success = obj?.success === true;
    const pending = obj?.pending === true;
    const errored = obj?.error_occured === true;
    let outcome: 'SUCCESS' | 'FAILED' | 'IGNORE' = 'IGNORE';
    if (pending) {
      outcome = 'IGNORE';
    } else if (success && !errored) {
      outcome = 'SUCCESS';
    } else {
      outcome = 'FAILED';
    }

    const orderId: string | null =
      obj?.payment_key_claims?.extra?.orderId ??
      obj?.order?.merchant_order_id ??
      obj?.order?.special_reference ??
      obj?.special_reference ??
      null;

    const transactionId: string | null =
      obj?.id != null ? String(obj.id) : null;

    return {
      outcome,
      orderId: orderId != null ? String(orderId) : null,
      transactionId,
      raw: parsed,
    };
  }

  async getTransactionStatus(transactionId: string): Promise<WebhookPayload> {
    const secretKey = this.configService.get<string>('PAYMOB_SECRET_KEY');
    if (!secretKey) {
      throw new InternalServerErrorException(
        'PAYMOB_SECRET_KEY is not configured',
      );
    }

    try {
      const res = await this.http.get(
        `/api/acceptance/transactions/${encodeURIComponent(transactionId)}`,
        { headers: { Authorization: `Token ${secretKey}` } },
      );
      const obj = res.data ?? {};
      const success = obj?.success === true && obj?.error_occured !== true;
      const orderId =
        obj?.payment_key_claims?.extra?.orderId ??
        obj?.order?.merchant_order_id ??
        obj?.order?.special_reference ??
        '';
      return {
        transactionId: String(transactionId),
        orderId: String(orderId ?? ''),
        status: success ? 'SUCCESS' : 'FAILED',
        amount: Number(obj?.amount_cents ?? 0) / 100,
        signature: '',
        rawPayload: obj,
      };
    } catch (error: any) {
      this.logger.error(
        `Paymob transaction lookup failed: ${error?.message ?? error}`,
      );
      throw error;
    }
  }

  private parseIntegrationIds(): number[] {
    const raw =
      this.configService.get<string>('PAYMOB_INTEGRATION_IDS') ?? '';
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n > 0);
  }

  private splitName(full: string | undefined): {
    firstName: string;
    lastName: string;
  } {
    const trimmed = (full ?? '').trim();
    if (!trimmed) return { firstName: 'Donor', lastName: 'Khairat' };
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: 'NA' };
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  private pickField(obj: any, dotted: string): string {
    const v = dotted
      .split('.')
      .reduce<any>((acc, k) => (acc == null ? acc : acc[k]), obj);
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    return String(v);
  }
}
