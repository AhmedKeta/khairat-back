import { Payment } from '../entities/payment.entity';

export abstract class PaymentRepositoryPort {
  abstract findById(id: string): Promise<Payment | null>;
  abstract findByOrderId(orderId: string): Promise<Payment | null>;
  abstract findByGatewayCustomerReference(
    ref: string,
  ): Promise<Payment | null>;
  abstract create(payment: Partial<Payment>): Promise<Payment>;
  abstract update(id: string, payment: Partial<Payment>): Promise<Payment>;
}
