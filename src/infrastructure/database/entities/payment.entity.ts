import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentStatus } from '../../../domain/payment/value-objects/payment-status.enum';
import { OrderEntity } from './order.entity';

@Entity('payments')
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @OneToOne(() => OrderEntity, (order) => order.payment)
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @Column({ default: 'polar' })
  provider: string;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: string;

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
