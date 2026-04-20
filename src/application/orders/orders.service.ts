import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { OrderRepositoryPort, OrderFilters } from '../../domain/order/ports/order.repository.port';
import { ServiceRepositoryPort } from '../../domain/service/ports/service.repository.port';
import { OrderStatus } from '../../domain/order/value-objects/order-status.enum';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { UserRole } from '../../domain/user/value-objects/user-role.enum';
import { TrackingService } from '../tracking/tracking.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderRepository: OrderRepositoryPort,
    private readonly serviceRepository: ServiceRepositoryPort,
    private readonly trackingService: TrackingService,
  ) {}

  async findAll(filters: OrderFilters) {
    return this.orderRepository.findAll(filters);
  }

  async findById(id: string, user: any) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    if (user.role !== UserRole.ADMIN && order.userId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async findMyOrders(userId: string, filters: PaginationDto) {
    return this.orderRepository.findByUserId(userId, filters);
  }

  async create(dto: CreateOrderDto, userId: string) {
    const service = await this.serviceRepository.findById(dto.serviceId);
    if (!service) throw new NotFoundException('Service not found');
    if (!service.isActive) throw new ForbiddenException('Service is not available');

    let trackingVisitId: string | null = null;
    if (dto.trackingVisitId) {
      await this.trackingService.assertVisitExists(dto.trackingVisitId);
      trackingVisitId = dto.trackingVisitId;
      await this.trackingService.linkVisitToUser(dto.trackingVisitId, userId);
    }

    const unitPrice = service.price;
    const subtotal = unitPrice * dto.quantity;
    const total = subtotal;

    return this.orderRepository.create({
      userId,
      serviceId: dto.serviceId,
      quantity: dto.quantity,
      unitPrice,
      subtotal,
      total,
      status: OrderStatus.PENDING,
      notes: dto.notes,
      trackingVisitId,
    });
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    return this.orderRepository.update(id, { status });
  }
}
