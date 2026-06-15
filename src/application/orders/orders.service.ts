import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { OrderRepositoryPort, OrderFilters } from '../../domain/order/ports/order.repository.port';
import { ServiceRepositoryPort } from '../../domain/service/ports/service.repository.port';
import { OrderStatus } from '../../domain/order/value-objects/order-status.enum';
import { OrderPurchaseType } from '../../domain/order/value-objects/order-purchase-type.enum';
import { OrderIntention } from '../../domain/order/value-objects/order-intention.enum';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDetailsDto } from './dto/update-order-details.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { UserRole } from '../../domain/user/value-objects/user-role.enum';
import { TrackingService } from '../tracking/tracking.service';
import {
  normalizeCurrency,
  POLAR_DEFAULT_CURRENCY,
} from '../../shared/constants/currencies';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

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
    if (!service.isPurchasable) {
      throw new ForbiddenException('Service is not available for purchase');
    }

    let trackingVisitId: string | null = null;
    if (dto.trackingVisitId) {
      try {
        await this.trackingService.assertVisitExists(dto.trackingVisitId);
        trackingVisitId = dto.trackingVisitId;
        await this.trackingService.linkVisitToUser(dto.trackingVisitId, userId);
      } catch (error) {
        // Tracking is analytics-only and must never block checkout.
        if (error instanceof NotFoundException) {
          this.logger.warn(
            `Ignoring stale tracking visit id "${dto.trackingVisitId}" during order creation`,
          );
        } else {
          throw error;
        }
      }
    }

    const purchaseType = dto.purchaseType ?? OrderPurchaseType.FULL;

    const requested = normalizeCurrency(dto.currency);
    const priceSource =
      purchaseType === OrderPurchaseType.SHARE
        ? Array.isArray(service.sharePrices)
          ? service.sharePrices
          : []
        : Array.isArray(service.prices)
          ? service.prices
          : [];

    if (
      purchaseType === OrderPurchaseType.SHARE &&
      priceSource.length === 0
    ) {
      throw new BadRequestException(
        'This service does not support share purchases',
      );
    }

    const match =
      priceSource.find(
        (p) => String(p.currency).toUpperCase() === requested,
      ) ??
      priceSource.find(
        (p) =>
          String(p.currency).toUpperCase() === POLAR_DEFAULT_CURRENCY,
      );

    if (purchaseType === OrderPurchaseType.SHARE && !match) {
      throw new BadRequestException(
        'No share price available for the requested currency',
      );
    }

    const currency = match
      ? String(match.currency).toUpperCase()
      : POLAR_DEFAULT_CURRENCY;
    const unitPrice = match
      ? Number(match.amount)
      : Number(service.price);
    const subtotal = unitPrice * dto.quantity;
    const total = subtotal;

    const country = dto.country ? dto.country.toUpperCase() : null;

    return this.orderRepository.create({
      userId,
      serviceId: dto.serviceId,
      quantity: dto.quantity,
      purchaseType,
      unitPrice,
      subtotal,
      total,
      currency,
      country,
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

  async updateDetails(id: string, dto: UpdateOrderDetailsDto, userId: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be updated');
    }

    const intentionOther =
      dto.intention === OrderIntention.OTHER
        ? (dto.intentionOther?.trim() ?? null)
        : null;

    return this.orderRepository.update(id, {
      intention: dto.intention,
      intentionOther,
      onBehalfOf: dto.onBehalfOf,
      dedicationGender: dto.dedicationGender,
      beneficiaryStatus: dto.beneficiaryStatus,
      shortDuaa: dto.shortDuaa ?? null,
      photoUrl: dto.photoUrl ?? null,
    });
  }
}
