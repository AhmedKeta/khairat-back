import { PaymentStatus } from '../value-objects/payment-status.enum';

export class Payment {
  id: string;
  orderId: string;
  provider: string;
  transactionId: string | null;
  gatewayCustomerReference: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gatewayUrl: string | null;
  responsePayload: Record<string, any> | null;
  webhookReceivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Payment>) {
    Object.assign(this, partial);
  }

  markAsSuccess(transactionId: string, payload: Record<string, any>): void {
    this.status = PaymentStatus.SUCCESS;
    this.transactionId = transactionId;
    this.responsePayload = payload;
    this.webhookReceivedAt = new Date();
  }

  markAsFailed(payload: Record<string, any>): void {
    this.status = PaymentStatus.FAILED;
    this.responsePayload = payload;
    this.webhookReceivedAt = new Date();
  }
}
