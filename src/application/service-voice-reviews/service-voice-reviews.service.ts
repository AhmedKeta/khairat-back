import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ServiceVoiceReviewRepositoryPort } from '../../domain/service-voice-review/ports/service-voice-review.repository.port';
import { ServiceRepositoryPort } from '../../domain/service/ports/service.repository.port';
import { UploadService } from '../upload/upload.service';
import { toStoredUploadRef } from '../upload/upload-path.util';
import { CreateServiceVoiceReviewDto } from './dto/create-service-voice-review.dto';
import { UpdateServiceVoiceReviewDto } from './dto/update-service-voice-review.dto';

@Injectable()
export class ServiceVoiceReviewsService {
  constructor(
    private readonly repo: ServiceVoiceReviewRepositoryPort,
    private readonly serviceRepository: ServiceRepositoryPort,
    private readonly uploadService: UploadService,
  ) {}

  private async ensureServiceExists(serviceId: string) {
    const service = await this.serviceRepository.findById(serviceId);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
  }

  async findVisibleByServiceId(serviceId: string) {
    await this.ensureServiceExists(serviceId);
    return this.repo.findByServiceId(serviceId, { visibleOnly: true });
  }

  async findAllByServiceId(serviceId: string) {
    await this.ensureServiceExists(serviceId);
    return this.repo.findByServiceId(serviceId);
  }

  async findById(serviceId: string, id: string) {
    const review = await this.repo.findById(id);
    if (!review || review.serviceId !== serviceId) {
      throw new NotFoundException('Voice review not found');
    }
    return review;
  }

  async create(serviceId: string, dto: CreateServiceVoiceReviewDto) {
    await this.ensureServiceExists(serviceId);
    const displayOrder = await this.repo.getNextDisplayOrder(serviceId);
    return this.repo.create({
      serviceId,
      reviewerName: dto.reviewerName.trim(),
      audioUrl: toStoredUploadRef(dto.audioUrl),
      transcript: dto.transcript?.trim() || null,
      transcriptAr: dto.transcriptAr?.trim() || null,
      rating: dto.rating ?? 5,
      isVisible: dto.isVisible ?? true,
      displayOrder,
    });
  }

  async update(serviceId: string, id: string, dto: UpdateServiceVoiceReviewDto) {
    const existing = await this.findById(serviceId, id);
    const payload: Parameters<ServiceVoiceReviewRepositoryPort['update']>[1] = {};

    if (dto.reviewerName !== undefined) {
      payload.reviewerName = dto.reviewerName.trim();
    }
    if (dto.audioUrl !== undefined) {
      payload.audioUrl = toStoredUploadRef(dto.audioUrl);
      if (existing.audioUrl && existing.audioUrl !== payload.audioUrl) {
        try {
          this.uploadService.deleteByPublicUrl(existing.audioUrl);
        } catch {
          /* file may already be missing */
        }
      }
    }
    if (dto.transcript !== undefined) {
      payload.transcript = dto.transcript?.trim() || null;
    }
    if (dto.transcriptAr !== undefined) {
      payload.transcriptAr = dto.transcriptAr?.trim() || null;
    }
    if (dto.rating !== undefined) payload.rating = dto.rating;
    if (dto.isVisible !== undefined) payload.isVisible = dto.isVisible;

    return this.repo.update(id, payload);
  }

  async toggleVisibility(serviceId: string, id: string) {
    const review = await this.findById(serviceId, id);
    return this.repo.update(id, { isVisible: !review.isVisible });
  }

  async delete(serviceId: string, id: string) {
    const review = await this.findById(serviceId, id);
    if (review.audioUrl) {
      try {
        this.uploadService.deleteByPublicUrl(review.audioUrl);
      } catch {
        /* file may already be missing */
      }
    }
    await this.repo.delete(id);
  }

  async reorder(serviceId: string, orderedIds: string[]) {
    await this.ensureServiceExists(serviceId);
    const count = await this.repo.countWhereIdsIn(serviceId, orderedIds);
    if (count !== orderedIds.length) {
      throw new BadRequestException(
        'One or more voice reviews do not belong to this service',
      );
    }
    await this.repo.reorder(serviceId, orderedIds);
  }
}
