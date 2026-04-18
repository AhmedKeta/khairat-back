import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from '../database/entities/service.entity';
import { ServiceRepositoryPort, ServiceFilters } from '../../domain/service/ports/service.repository.port';
import { Service } from '../../domain/service/entities/service.entity';
import { PaginatedResult } from '../../shared/dto/pagination.dto';

@Injectable()
export class ServiceRepository implements ServiceRepositoryPort {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly repo: Repository<ServiceEntity>,
  ) {}

  async findAll(filters: ServiceFilters): Promise<PaginatedResult<Service>> {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', sortOrder = 'DESC', isActive, minPrice, maxPrice } = filters;

    const query = this.repo.createQueryBuilder('service');

    if (search) {
      query.andWhere(
        "(service.title->>'en' ILIKE :search OR service.title->>'ar' ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (isActive !== undefined) query.andWhere('service.isActive = :isActive', { isActive });
    if (minPrice) query.andWhere('service.price >= :minPrice', { minPrice });
    if (maxPrice) query.andWhere('service.price <= :maxPrice', { maxPrice });

    query.orderBy(`service.${sortBy}`, sortOrder as 'ASC' | 'DESC');
    query.skip((page - 1) * limit).take(limit);

    const [entities, total] = await query.getManyAndCount();

    return {
      data: entities.map(this.toDomain),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<Service | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async create(service: Partial<Service>): Promise<Service> {
    const entity = this.repo.create(service as Partial<ServiceEntity>);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(id: string, service: Partial<Service>): Promise<Service> {
    await this.repo.update(id, service as Partial<ServiceEntity>);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  private toDomain(entity: ServiceEntity): Service {
    return new Service({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      price: Number(entity.price),
      currency: entity.currency,
      feedsCount: entity.feedsCount,
      images: entity.images,
      videos: entity.videos,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
