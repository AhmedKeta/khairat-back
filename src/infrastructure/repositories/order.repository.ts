import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../database/entities/order.entity';
import { OrderRepositoryPort, OrderFilters } from '../../domain/order/ports/order.repository.port';
import { Order } from '../../domain/order/entities/order.entity';
import { OrderPurchaseType } from '../../domain/order/value-objects/order-purchase-type.enum';
import { PaginatedResult, PaginationDto } from '../../shared/dto/pagination.dto';
import { OrderStatus } from '../../domain/order/value-objects/order-status.enum';

@Injectable()
export class OrderRepository implements OrderRepositoryPort {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repo: Repository<OrderEntity>,
  ) {}

  async findAll(filters: OrderFilters): Promise<PaginatedResult<Order>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC', userId, status, dateFrom, dateTo } = filters;

    const query = this.repo.createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.service', 'service')
      .leftJoinAndSelect('order.trackingVisit', 'trackingVisit')
      .leftJoinAndSelect('order.payment', 'payment');

    if (userId) query.andWhere('order.userId = :userId', { userId });
    if (status) query.andWhere('order.status = :status', { status });
    if (dateFrom) query.andWhere('order.createdAt >= :dateFrom', { dateFrom });
    if (dateTo) query.andWhere('order.createdAt <= :dateTo', { dateTo });

    query.orderBy(`order.${sortBy}`, sortOrder as 'ASC' | 'DESC');
    query.skip((page - 1) * limit).take(limit);

    const [entities, total] = await query.getManyAndCount();

    return {
      data: entities.map(this.toDomain),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<Order | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['user', 'service', 'trackingVisit', 'payment'],
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string, filters: PaginationDto): Promise<PaginatedResult<Order>> {
    return this.findAll({ ...filters, userId });
  }

  async create(order: Partial<Order>): Promise<Order> {
    const entity = this.repo.create(order as Partial<OrderEntity>);
    const saved = await this.repo.save(entity);
    return this.findById(saved.id);
  }

  async update(id: string, order: Partial<Order>): Promise<Order> {
    await this.repo.update(id, order as Partial<OrderEntity>);
    return this.findById(id);
  }

  async migratePendingWithoutGatewayToInCheckout(): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .update(OrderEntity)
      .set({ status: OrderStatus.IN_CHECKOUT })
      .where('status = :status', { status: OrderStatus.PENDING })
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM payments p
          WHERE p.order_id = orders.id AND p.gateway_url IS NOT NULL
        )`,
      )
      .execute();

    return result.affected ?? 0;
  }

  private toDomain(entity: OrderEntity): Order {
    const order = new Order({
      id: entity.id,
      userId: entity.userId,
      serviceId: entity.serviceId,
      quantity: entity.quantity,
      purchaseType: entity.purchaseType ?? OrderPurchaseType.FULL,
      unitPrice: Number(entity.unitPrice),
      subtotal: Number(entity.subtotal),
      total: Number(entity.total),
      currency: entity.currency ?? 'USD',
      country: entity.country ?? null,
      status: entity.status,
      paymentId: entity.paymentId,
      notes: entity.notes,
      intention: entity.intention ?? null,
      intentionOther: entity.intentionOther ?? null,
      onBehalfOf: entity.onBehalfOf ?? null,
      dedicationGender: entity.dedicationGender ?? null,
      beneficiaryStatus: entity.beneficiaryStatus ?? null,
      shortDuaa: entity.shortDuaa ?? null,
      photoUrl: entity.photoUrl ?? null,
      trackingVisitId: entity.trackingVisitId ?? null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
    (order as any).user = entity.user;
    (order as any).service = entity.service;
    (order as any).trackingVisit = entity.trackingVisit;
    (order as any).payment = entity.payment ?? null;
    return order;
  }
}
