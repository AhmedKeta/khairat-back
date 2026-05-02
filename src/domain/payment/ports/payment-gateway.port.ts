export interface InitiatePaymentDto {
  orderId: string;
  userId: string;
  serviceId: string;
  quantity: number;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCountry?: string;
  returnUrl: string;
  webhookUrl: string;
}

export interface PaymentGatewayResponse {
  transactionId: string;
  redirectUrl: string;
  status: string;
  rawResponse: Record<string, any>;
  /**
   * Gateways that correlate webhooks via a merchant reference (e.g. EasyKash
   * Direct Pay `customerReference`) persist this on `payments.gateway_customer_reference`.
   */
  gatewayCustomerReference?: string;
}

export interface WebhookPayload {
  transactionId: string;
  orderId: string;
  status: 'SUCCESS' | 'FAILED';
  amount: number;
  signature: string;
  rawPayload: Record<string, any>;
}

/**
 * Normalized webhook event each gateway adapter must return after verifying
 * the inbound signature. Outcome semantics live with the adapter so
 * `PaymentsService` stays gateway-agnostic.
 */
export type ParsedWebhookEvent = {
  outcome: 'SUCCESS' | 'FAILED' | 'IGNORE';
  orderId: string | null;
  transactionId: string | null;
  raw: Record<string, any>;
};

export abstract class PaymentGatewayPort {
  /**
   * Stable, lowercase identifier used by the router and persisted on the
   * payment row as `provider` (e.g. 'polar', 'paymob').
   */
  abstract readonly id: string;

  abstract initiatePayment(dto: InitiatePaymentDto): Promise<PaymentGatewayResponse>;

  /**
   * Validate the webhook signature and parse the request into a normalized
   * `ParsedWebhookEvent`. Throws if the signature is invalid.
   *
   * Some gateways sign the body (Polar — Standard Webhooks header),
   * others sign a query parameter (Paymob — `?hmac=`).
   */
  abstract verifyAndParseEvent(
    body: Buffer,
    headers: Record<string, string | string[] | undefined>,
    query: Record<string, string>,
  ): Promise<ParsedWebhookEvent>;

  abstract getTransactionStatus(transactionId: string): Promise<WebhookPayload>;
}
