import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PaymentStatus } from '../../../domain/payment/value-objects/payment-status.enum';
import { OrderEntity } from './order.entity';

@Entity('payments')
@Index('UQ_payments_order_installment', ['orderId', 'installmentNumber'], {
  unique: true,
})
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => OrderEntity, (order) => order.payments)
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @Column({ name: 'installment_number', type: 'int', default: 1 })
  installmentNumber: number;

  @Column({ default: 'polar' })
  provider: string;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: string;

  /**
   * Gateway-specific merchant reference (e.g. EasyKash `customerReference`).
   * Used to correlate server callbacks when the gateway does not echo `orderId`.
   */
  @Column({
    name: 'gateway_customer_reference',
    nullable: true,
    length: 32,
  })
  gatewayCustomerReference: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.INITIATED,
  })
  status: PaymentStatus;

  @Column({ name: 'gateway_url', nullable: true, type: 'text' })
  gatewayUrl: string;

  @Column({ name: 'response_payload', nullable: true, type: 'jsonb' })
  responsePayload: Record<string, any>;

  @Column({ name: 'webhook_received_at', nullable: true })
  webhookReceivedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
