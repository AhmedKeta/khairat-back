import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRepositoryPort, ServiceFilters } from '../../domain/service/ports/service.repository.port';
import { ServiceVoiceReviewRepositoryPort } from '../../domain/service-voice-review/ports/service-voice-review.repository.port';
import { ServiceCategoriesService } from '../service-categories/service-categories.service';
import { ServiceMarksService } from '../service-marks/service-marks.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { toStoredUploadRef } from '../upload/upload-path.util';
import { UploadService } from '../upload/upload.service';
import { CardPriceDisplay } from '../../domain/service/value-objects/card-price-display.enum';
import { OrderEntity } from '../../infrastructure/database/entities/order.entity';

function normalizeDetailNote(
  value?: { ar?: string; en?: string } | null,
): { ar: string; en: string } | null {
  if (!value) return null;
  const ar = value.ar?.trim() || '';
  const en = value.en?.trim() || '';
  if (!ar && !en) return null;
  return { ar, en };
}

/**
 * Keep only refs that exist in images ∪ videos, preserve requested order,
 * then append any media that was omitted from the requested list.
 */
function normalizeMediaOrder(
  images: string[],
  videos: string[],
  requested?: string[],
): string[] {
  const known = new Set([...images, ...videos]);
  const seen = new Set<string>();
  const ordered = (requested ?? [])
    .map(toStoredUploadRef)
    .filter((r) => known.has(r) && !seen.has(r) && (seen.add(r), true));
  return [
    ...ordered,
    ...[...images, ...videos].filter((r) => !seen.has(r)),
  ];
}

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(
    private readonly serviceRepository: ServiceRepositoryPort,
    private readonly voiceReviewRepository: ServiceVoiceReviewRepositoryPort,
    private readonly categoriesService: ServiceCategoriesService,
    private readonly marksService: ServiceMarksService,
    private readonly uploadService: UploadService,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
  ) {}

  private async resolveCategoryId(categoryId: string): Promise<string> {
    const category = await this.categoriesService.findByIdOrNull(categoryId);
    if (!category) {
      throw new BadRequestException('Service category not found');
    }
    return category.id;
  }

  async findAll(filters: ServiceFilters) {
    return this.serviceRepository.findAll(filters);
  }

  async findById(id: string) {
    const service = await this.serviceRepository.findById(id);
    if (!service) throw new NotFoundException('Service not found');
    const voiceReviews = await this.voiceReviewRepository.findByServiceId(id, {
      visibleOnly: true,
    });
    return { ...service, voiceReviews };
  }

  async create(dto: CreateServiceDto) {
    const categoryId = dto.categoryId
      ? await this.resolveCategoryId(dto.categoryId)
      : null;

    const prices = (dto.prices ?? []).map((p) => ({
      currency: String(p.currency).toUpperCase(),
      amount: Number(p.amount),
    }));

    const sharePrices = (dto.sharePrices ?? []).map((p) => ({
      currency: String(p.currency).toUpperCase(),
      amount: Number(p.amount),
    }));

    const images = (dto.images || []).map(toStoredUploadRef);
    const videos = (dto.videos || []).map(toStoredUploadRef);
    const mediaOrder = normalizeMediaOrder(images, videos, dto.mediaOrder);

    const displayOrder = await this.serviceRepository.getNextDisplayOrder();

    const service = await this.serviceRepository.create({
      title: dto.title,
      description: dto.description,
      prices,
      sharePrices,
      shareDescription: dto.shareDescription ?? null,
      cardPriceDisplay: dto.cardPriceDisplay ?? CardPriceDisplay.FULL,
      feedsCount: dto.feedsCount,
      detailNote: normalizeDetailNote(dto.detailNote),
      images,
      videos,
      mediaOrder,
      isActive: true,
      displayOrder,
      categoryId,
    });

    if (dto.markIds !== undefined) {
      await this.marksService.syncServiceMarks(service.id, dto.markIds);
      return this.findById(service.id);
    }

    return service;
  }

  async update(id: string, dto: UpdateServiceDto) {
    const existing = await this.findById(id);
    const payload: any = { ...dto };

    if (dto.categoryId !== undefined) {
      payload.categoryId = dto.categoryId
        ? await this.resolveCategoryId(dto.categoryId)
        : null;
    }

    if (Array.isArray(dto.prices)) {
      payload.prices = dto.prices.map((p) => ({
        currency: String(p.currency).toUpperCase(),
        amount: Number(p.amount),
      }));
    }
    if (dto.sharePrices !== undefined) {
      payload.sharePrices = dto.sharePrices.map((p) => ({
        currency: String(p.currency).toUpperCase(),
        amount: Number(p.amount),
      }));
    }
    if (dto.images !== undefined) {
      payload.images = dto.images.map(toStoredUploadRef);
      this.uploadService.diffAndDelete(existing.images, payload.images);
    }
    if (dto.videos !== undefined) {
      payload.videos = dto.videos.map(toStoredUploadRef);
      this.uploadService.diffAndDelete(existing.videos, payload.videos);
    }
    if (
      dto.images !== undefined ||
      dto.videos !== undefined ||
      dto.mediaOrder !== undefined
    ) {
      const nextImages = payload.images ?? existing.images ?? [];
      const nextVideos = payload.videos ?? existing.videos ?? [];
      payload.mediaOrder = normalizeMediaOrder(
        nextImages,
        nextVideos,
        dto.mediaOrder ?? existing.mediaOrder,
      );
    }
    if (dto.detailNote !== undefined) {
      payload.detailNote = normalizeDetailNote(dto.detailNote);
    }
    delete payload.category;
    delete payload.markIds;

    const updated = await this.serviceRepository.update(id, payload);

    if (dto.markIds !== undefined) {
      await this.marksService.syncServiceMarks(id, dto.markIds);
      return this.findById(id);
    }

    return updated;
  }

  async delete(id: string) {
    const service = await this.findById(id);

    const orderCount = await this.orderRepo.count({ where: { serviceId: id } });
    if (orderCount > 0) {
      throw new ConflictException(
        `Cannot delete service: ${orderCount} order(s) still reference it. Disable the service instead.`,
      );
    }

    this.uploadService.safeDeleteMany([
      ...(service.images ?? []),
      ...(service.videos ?? []),
      ...((service.voiceReviews ?? []).map((r) => r.audioUrl)),
    ]);
    await this.serviceRepository.delete(id);
  }

  async toggleActive(id: string) {
    const service = await this.findById(id);
    return this.serviceRepository.update(id, { isActive: !service.isActive });
  }

  async reorder(orderedIds: string[]) {
    const count = await this.serviceRepository.countWhereIdsIn(orderedIds);
    if (count !== orderedIds.length) {
      throw new BadRequestException('One or more services do not exist');
    }
    await this.serviceRepository.reorder(orderedIds);
  }
}
