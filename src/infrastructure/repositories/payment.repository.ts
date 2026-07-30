import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentEntity } from '../database/entities/payment.entity';
import { PaymentRepositoryPort } from '../../domain/payment/ports/payment.repository.port';
import { Payment } from '../../domain/payment/entities/payment.entity';
import { PaymentStatus } from '../../domain/payment/value-objects/payment-status.enum';

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
    const entity = await this.repo.findOne({
      where: { orderId },
      order: { installmentNumber: 'DESC', createdAt: 'DESC' },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByOrderIdAndInstallment(
    orderId: string,
    installmentNumber: number,
  ): Promise<Payment | null> {
    const entity = await this.repo.findOne({
      where: { orderId, installmentNumber },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findLatestInitiatedByOrderId(
    orderId: string,
  ): Promise<Payment | null> {
    const entity = await this.repo.findOne({
      where: { orderId, status: PaymentStatus.INITIATED },
      order: { createdAt: 'DESC' },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByGatewayCustomerReference(ref: string): Promise<Payment | null> {
    const key = ref?.trim();
    if (!key) return null;
    const entity = await this.repo.findOne({
      where: { gatewayCustomerReference: key },
    });
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
      installmentNumber: entity.installmentNumber ?? 1,
      provider: entity.provider,
      transactionId: entity.transactionId,
      gatewayCustomerReference: entity.gatewayCustomerReference ?? null,
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
