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
  returnUrl: string;
  webhookUrl: string;
}

export interface PaymentGatewayResponse {
  transactionId: string;
  redirectUrl: string;
  status: string;
  rawResponse: Record<string, any>;
}

export interface WebhookPayload {
  transactionId: string;
  orderId: string;
  status: 'SUCCESS' | 'FAILED';
  amount: number;
  signature: string;
  rawPayload: Record<string, any>;
}

export type ParsedWebhookEvent = {
  type: string;
  data: Record<string, any>;
  raw: Record<string, any>;
};

export abstract class PaymentGatewayPort {
  abstract initiatePayment(dto: InitiatePaymentDto): Promise<PaymentGatewayResponse>;

  /**
   * Validate the webhook signature and parse the raw body into a typed event.
   * Throws if the signature is invalid.
   */
  abstract verifyAndParseEvent(
    body: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ): ParsedWebhookEvent;

  abstract getTransactionStatus(transactionId: string): Promise<WebhookPayload>;
}
