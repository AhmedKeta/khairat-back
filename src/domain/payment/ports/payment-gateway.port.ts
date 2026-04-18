export interface InitiatePaymentDto {
  orderId: string;
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

export abstract class PaymentGatewayPort {
  abstract initiatePayment(dto: InitiatePaymentDto): Promise<PaymentGatewayResponse>;
  abstract verifyWebhookSignature(payload: Record<string, any>, signature: string): boolean;
  abstract getTransactionStatus(transactionId: string): Promise<WebhookPayload>;
}
