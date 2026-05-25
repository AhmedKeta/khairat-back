import { OrderStatus } from '../value-objects/order-status.enum';
import { OrderPurchaseType } from '../value-objects/order-purchase-type.enum';
import { OrderIntention } from '../value-objects/order-intention.enum';
import { DedicationGender } from '../value-objects/dedication-gender.enum';
import { BeneficiaryStatus } from '../value-objects/beneficiary-status.enum';

export class Order {
  id: string;
  userId: string;
  serviceId: string;
  quantity: number;
  purchaseType: OrderPurchaseType;
  unitPrice: number;
  subtotal: number;
  total: number;
  currency: string;
  country: string | null;
  status: OrderStatus;
  paymentId: string | null;
  notes: string | null;
  intention: OrderIntention | null;
  intentionOther: string | null;
  onBehalfOf: string[] | null;
  dedicationGender: DedicationGender | null;
  beneficiaryStatus: BeneficiaryStatus | null;
  shortDuaa: string | null;
  photoUrl: string | null;
  trackingVisitId?: string | null;
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
