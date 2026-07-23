import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ServiceEntity } from '../database/entities/service.entity';
import { ServiceRepositoryPort, ServiceFilters } from '../../domain/service/ports/service.repository.port';
import {
  Service,
  ServicePrice,
  computeIsPurchasable,
} from '../../domain/service/entities/service.entity';
import { CardPriceDisplay } from '../../domain/service/value-objects/card-price-display.enum';
import { PaginatedResult } from '../../shared/dto/pagination.dto';
import { POLAR_DEFAULT_CURRENCY } from '../../shared/constants/currencies';
import { resolveSortColumn } from '../../shared/utils/sort-column.util';

const SERVICE_SORT_COLUMNS = [
  'displayOrder',
  'createdAt',
  'updatedAt',
  'price',
  'feedsCount',
] as const;

@Injectable()
export class ServiceRepository implements ServiceRepositoryPort {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly repo: Repository<ServiceEntity>,
  ) {}

  async findAll(filters: ServiceFilters): Promise<PaginatedResult<Service>> {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'displayOrder',
      sortOrder = 'ASC',
      isActive,
      minPrice,
      maxPrice,
      categoryId,
      categorySlug,
    } = filters;

    const query = this.repo
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.category', 'category')
      .leftJoinAndSelect('service.markAssignments', 'markAssignment')
      .leftJoinAndSelect('markAssignment.mark', 'mark');

    if (search) {
      query.andWhere(
        "(service.title->>'en' ILIKE :search OR service.title->>'ar' ILIKE :search)",
        { search: `%${search}%` },
      );
    }

    if (isActive !== undefined) query.andWhere('service.isActive = :isActive', { isActive });
    if (minPrice) query.andWhere('service.price >= :minPrice', { minPrice });
    if (maxPrice) query.andWhere('service.price <= :maxPrice', { maxPrice });
    if (categoryId) query.andWhere('service.categoryId = :categoryId', { categoryId });
    if (categorySlug) query.andWhere('category.slug = :categorySlug', { categorySlug });

    const safeSortBy = resolveSortColumn(sortBy, SERVICE_SORT_COLUMNS, 'displayOrder');
    query
      .orderBy(`service.${safeSortBy}`, sortOrder as 'ASC' | 'DESC')
      .addOrderBy('service.createdAt', 'DESC');
    query.skip((page - 1) * limit).take(limit);

    const [entities, total] = await query.getManyAndCount();

    return {
      data: entities.map((entity) => this.toDomain(entity)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<Service | null> {
    const entity = await this.repo.findOne({
      where: { id },
      relations: ['category', 'markAssignments', 'markAssignments.mark'],
    });
    return entity ? this.toDomain(entity) : null;
  }

  async create(service: Partial<Service>): Promise<Service> {
    const payload = this.syncLegacyFields(service);
    const entity = this.repo.create(payload as Partial<ServiceEntity>);
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(id: string, service: Partial<Service>): Promise<Service> {
    const payload = this.syncLegacyFields(service);
    await this.repo.update(id, payload as Partial<ServiceEntity>);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async getNextDisplayOrder(): Promise<number> {
    const row = await this.repo
      .createQueryBuilder('s')
      .select('MAX(s.displayOrder)', 'max')
      .getRawOne<{ max: string | null }>();
    const max = row?.max != null ? Number(row.max) : NaN;
    return Number.isFinite(max) ? max + 1 : 0;
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await this.repo.manager.transaction(async (em) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await em.update(ServiceEntity, { id: orderedIds[i] }, { displayOrder: i });
      }
    });
  }

  async countWhereIdsIn(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    return this.repo.count({ where: { id: In(ids) } });
  }

  private normalizePrices(raw: unknown): ServicePrice[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((p) => p && typeof p === 'object')
      .map((p: any) => ({
        currency: String(p.currency ?? '').toUpperCase(),
        amount: Number(p.amount),
      }))
      .filter((p) => p.currency && Number.isFinite(p.amount));
  }

  private syncLegacyFields(service: Partial<Service>): Partial<Service> {
    const copy: Partial<Service> = { ...service };
    delete copy.category;
    delete copy.marks;
    if (copy.prices !== undefined) {
      copy.prices = this.normalizePrices(copy.prices);
      const usdEntry =
        copy.prices.find((p) => p.currency === POLAR_DEFAULT_CURRENCY) ??
        copy.prices[0];
      if (usdEntry) {
        if (copy.price === undefined) copy.price = usdEntry.amount;
        if (copy.currency === undefined) copy.currency = usdEntry.currency;
      }
    }
    if (copy.sharePrices !== undefined) {
      copy.sharePrices = this.normalizePrices(copy.sharePrices);
    }
    return copy;
  }

  private mapMarks(entity: ServiceEntity) {
    const assignments = entity.markAssignments ?? [];
    return [...assignments]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .filter((assignment) => assignment.mark)
      .map((assignment) => ({
        id: assignment.mark.id,
        name: assignment.mark.name,
        backgroundColor: assignment.mark.backgroundColor,
        textColor: assignment.mark.textColor,
        displayOrder: assignment.displayOrder,
        isActive: assignment.mark.isActive,
        makesUnavailable: assignment.mark.makesUnavailable ?? false,
      }));
  }

  private toDomain(entity: ServiceEntity): Service {
    const prices: ServicePrice[] = Array.isArray(entity.prices)
      ? entity.prices.map((p) => ({
          currency: String(p.currency ?? '').toUpperCase(),
          amount: Number(p.amount),
        }))
      : [];

    if (prices.length === 0 && entity.price != null && entity.currency) {
      prices.push({
        currency: entity.currency.toUpperCase(),
        amount: Number(entity.price),
      });
    }

    const sharePrices: ServicePrice[] = Array.isArray(entity.sharePrices)
      ? entity.sharePrices.map((p) => ({
          currency: String(p.currency ?? '').toUpperCase(),
          amount: Number(p.amount),
        }))
      : [];

    const marks = this.mapMarks(entity);

    return new Service({
      id: entity.id,
      title: entity.title,
      description: entity.description,
      price: Number(entity.price),
      currency: entity.currency,
      prices,
      sharePrices,
      shareDescription: entity.shareDescription ?? null,
      cardPriceDisplay:
        entity.cardPriceDisplay === CardPriceDisplay.SHARE
          ? CardPriceDisplay.SHARE
          : CardPriceDisplay.FULL,
      feedsCount: entity.feedsCount,
      detailNote: entity.detailNote ?? null,
      images: entity.images,
      videos: entity.videos,
      isActive: entity.isActive,
      polarProductId: entity.polarProductId ?? null,
      displayOrder: entity.displayOrder ?? 0,
      categoryId: entity.categoryId ?? null,
      category: entity.category
        ? {
            id: entity.category.id,
            name: entity.category.name,
            slug: entity.category.slug,
          }
        : null,
      marks,
      isPurchasable: computeIsPurchasable(entity.isActive, marks),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
