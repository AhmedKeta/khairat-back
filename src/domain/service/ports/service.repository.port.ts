import { Service } from '../entities/service.entity';
import { PaginatedResult, PaginationDto } from '../../../shared/dto/pagination.dto';

export interface ServiceFilters extends PaginationDto {
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export abstract class ServiceRepositoryPort {
  abstract findAll(filters: ServiceFilters): Promise<PaginatedResult<Service>>;
  abstract findById(id: string): Promise<Service | null>;
  abstract create(service: Partial<Service>): Promise<Service>;
  abstract update(id: string, service: Partial<Service>): Promise<Service>;
  abstract delete(id: string): Promise<void>;
  abstract getNextDisplayOrder(): Promise<number>;
  abstract reorder(orderedIds: string[]): Promise<void>;
  abstract countWhereIdsIn(ids: string[]): Promise<number>;
}
