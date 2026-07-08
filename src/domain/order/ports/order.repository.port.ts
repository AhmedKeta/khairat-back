import { Order } from '../entities/order.entity';
import { PaginatedResult, PaginationDto } from '../../../shared/dto/pagination.dto';

export interface OrderFilters extends PaginationDto {
  userId?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export abstract class OrderRepositoryPort {
  abstract findAll(filters: OrderFilters): Promise<PaginatedResult<Order>>;
  abstract findById(id: string): Promise<Order | null>;
  abstract findByUserId(userId: string, filters: PaginationDto): Promise<PaginatedResult<Order>>;
  abstract create(order: Partial<Order>): Promise<Order>;
  abstract update(id: string, order: Partial<Order>): Promise<Order>;
  abstract migratePendingWithoutGatewayToInCheckout(): Promise<number>;
}
