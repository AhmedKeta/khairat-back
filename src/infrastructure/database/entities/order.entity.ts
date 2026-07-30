import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { OrderStatus } from '../../../domain/order/value-objects/order-status.enum';
import { OrderPurchaseType } from '../../../domain/order/value-objects/order-purchase-type.enum';
import { OrderPaymentPlan } from '../../../domain/order/value-objects/order-payment-plan.enum';
import { OrderIntention } from '../../../domain/order/value-objects/order-intention.enum';
import { DedicationGender } from '../../../domain/order/value-objects/dedication-gender.enum';
import { BeneficiaryStatus } from '../../../domain/order/value-objects/beneficiary-status.enum';
import { UserEntity } from './user.entity';
import { ServiceEntity } from './service.entity';
import { UserTrackingEntity } from './user-tracking.entity';
import { PaymentEntity } from './payment.entity';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'service_id' })
  serviceId: string;

  @ManyToOne(() => ServiceEntity)
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({
    name: 'purchase_type',
    type: 'varchar',
    length: 16,
    default: OrderPurchaseType.FULL,
  })
  purchaseType: OrderPurchaseType;

  @Column({
    name: 'payment_plan',
    type: 'varchar',
    length: 16,
    default: OrderPaymentPlan.FULL,
  })
  paymentPlan: OrderPaymentPlan;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({
    name: 'amount_paid',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountPaid: number;

  @Column({ default: 'USD' })
  currency: string;

  /**
   * ISO-3166 alpha-2 country code captured from the donor's selection at
   * checkout. Used by `PaymentGatewayRouter` as a fallback when the order's
   * currency is not enough to pick a gateway.
   */
  @Column({ length: 2, nullable: true })
  country: string | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.IN_CHECKOUT,
  })
  status: OrderStatus;

  @Column({ name: 'payment_id', nullable: true })
  paymentId: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  intention: OrderIntention | null;

  @Column({ name: 'intention_other', type: 'varchar', length: 250, nullable: true })
  intentionOther: string | null;

  @Column({ name: 'on_behalf_of', type: 'jsonb', nullable: true })
  onBehalfOf: string[] | null;

  @Column({ name: 'dedication_gender', type: 'varchar', length: 32, nullable: true })
  dedicationGender: DedicationGender | null;

  @Column({ name: 'beneficiary_status', type: 'varchar', length: 32, nullable: true })
  beneficiaryStatus: BeneficiaryStatus | null;

  @Column({ name: 'short_duaa', type: 'text', nullable: true })
  shortDuaa: string | null;

  @Column({ name: 'photo_url', type: 'varchar', length: 512, nullable: true })
  photoUrl: string | null;

  @Column({ name: 'tracking_visit_id', nullable: true })
  trackingVisitId?: string | null;

  @ManyToOne(() => UserTrackingEntity, { nullable: true })
  @JoinColumn({ name: 'tracking_visit_id' })
  trackingVisit?: UserTrackingEntity | null;

  @OneToMany(() => PaymentEntity, (payment) => payment.order)
  payments?: PaymentEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
