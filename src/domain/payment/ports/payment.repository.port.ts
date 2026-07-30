import { Payment } from '../entities/payment.entity';
import { PaymentStatus } from '../value-objects/payment-status.enum';

export abstract class PaymentRepositoryPort {
  abstract findById(id: string): Promise<Payment | null>;
  /** Latest payment for the order (any installment), or null. */
  abstract findByOrderId(orderId: string): Promise<Payment | null>;
  abstract findByOrderIdAndInstallment(
    orderId: string,
    installmentNumber: number,
  ): Promise<Payment | null>;
  /** Most recent INITIATED payment for the order (for webhook correlation). */
  abstract findLatestInitiatedByOrderId(
    orderId: string,
  ): Promise<Payment | null>;
  abstract findByGatewayCustomerReference(
    ref: string,
  ): Promise<Payment | null>;
  abstract create(payment: Partial<Payment>): Promise<Payment>;
  abstract update(id: string, payment: Partial<Payment>): Promise<Payment>;
}
