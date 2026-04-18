import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../database/entities/payment.entity';
import { PaymentRepositoryPort } from '../../domain/payment/ports/payment.repository.port';
import { Payment } from '../../domain/payment/entities/payment.entity';

@Injectable()
export class PaymentRepository implements PaymentRepositoryPort {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly repo: Repository<PaymentEntity>,
  ) {}

  async findById(id: string): Promise<Payment | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const entity = await this.repo.findOne({ where: { orderId } });
    return entity ? this.toDomain(entity) : null;
  }

  async create(payment: Partial<Payment>): Promise<Payment> {
    const entity = this.repo.create(payment as Partial<PaymentEntity>);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(id: string, payment: Partial<Payment>): Promise<Payment> {
    await this.repo.update(id, payment as Partial<PaymentEntity>);
    return this.findById(id);
  }

  private toDomain(entity: PaymentEntity): Payment {
    return new Payment({
      id: entity.id,
      orderId: entity.orderId,
      provider: entity.provider,
      transactionId: entity.transactionId,
      amount: Number(entity.amount),
      currency: entity.currency,
      status: entity.status,
      gatewayUrl: entity.gatewayUrl,
      responsePayload: entity.responsePayload,
      webhookReceivedAt: entity.webhookReceivedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
