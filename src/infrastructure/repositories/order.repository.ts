import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../database/entities/order.entity';
import { OrderRepositoryPort, OrderFilters } from '../../domain/order/ports/order.repository.port';
import { Order } from '../../domain/order/entities/order.entity';
import { PaginatedResult, PaginationDto } from '../../shared/dto/pagination.dto';

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
      .leftJoinAndSelect('order.service', 'service');

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
      relations: ['user', 'service'],
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

  private toDomain(entity: OrderEntity): Order {
    const order = new Order({
      id: entity.id,
      userId: entity.userId,
      serviceId: entity.serviceId,
      quantity: entity.quantity,
      unitPrice: Number(entity.unitPrice),
      subtotal: Number(entity.subtotal),
      total: Number(entity.total),
      status: entity.status,
      paymentId: entity.paymentId,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
    (order as any).user = entity.user;
    (order as any).service = entity.service;
    return order;
  }
}
