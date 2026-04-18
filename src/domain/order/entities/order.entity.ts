import { OrderStatus } from '../value-objects/order-status.enum';

export class Order {
  id: string;
  userId: string;
  serviceId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  paymentId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Order>) {
    Object.assign(this, partial);
  }

  calculateTotals(): void {
    this.subtotal = this.unitPrice * this.quantity;
    this.total = this.subtotal;
  }

  markAsPaid(paymentId: string): void {
    this.status = OrderStatus.PAID;
    this.paymentId = paymentId;
  }

  markAsFailed(): void {
    this.status = OrderStatus.FAILED;
  }

  cancel(): void {
    if (this.status === OrderStatus.PENDING) {
      this.status = OrderStatus.CANCELLED;
    }
  }
}
