import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ServiceVoiceReviewRepositoryPort } from '../../domain/service-voice-review/ports/service-voice-review.repository.port';
import { ServiceVoiceReview } from '../../domain/service-voice-review/entities/service-voice-review.entity';
import { ServiceVoiceReviewEntity } from '../database/entities/service-voice-review.entity';

@Injectable()
export class ServiceVoiceReviewRepository implements ServiceVoiceReviewRepositoryPort {
  constructor(
    @InjectRepository(ServiceVoiceReviewEntity)
    private readonly repo: Repository<ServiceVoiceReviewEntity>,
  ) {}

  async findByServiceId(
    serviceId: string,
    options?: { visibleOnly?: boolean },
  ): Promise<ServiceVoiceReview[]> {
    const where: { serviceId: string; isVisible?: boolean } = { serviceId };
    if (options?.visibleOnly) {
      where.isVisible = true;
    }
    const entities = await this.repo.find({
      where,
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async findById(id: string): Promise<ServiceVoiceReview | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async create(data: Partial<ServiceVoiceReview>): Promise<ServiceVoiceReview> {
    const entity = this.repo.create({
      serviceId: data.serviceId,
      reviewerName: data.reviewerName,
      audioUrl: data.audioUrl,
      transcript: data.transcript ?? null,
      transcriptAr: data.transcriptAr ?? null,
      rating: data.rating ?? 5,
      displayOrder: data.displayOrder ?? 0,
      isVisible: data.isVisible ?? true,
    });
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async update(
    id: string,
    data: Partial<ServiceVoiceReview>,
  ): Promise<ServiceVoiceReview> {
    const payload: Partial<ServiceVoiceReviewEntity> = {};
    if (data.reviewerName !== undefined) payload.reviewerName = data.reviewerName;
    if (data.audioUrl !== undefined) payload.audioUrl = data.audioUrl;
    if (data.transcript !== undefined) payload.transcript = data.transcript;
    if (data.transcriptAr !== undefined) payload.transcriptAr = data.transcriptAr;
    if (data.rating !== undefined) payload.rating = data.rating;
    if (data.displayOrder !== undefined) payload.displayOrder = data.displayOrder;
    if (data.isVisible !== undefined) payload.isVisible = data.isVisible;
    await this.repo.update(id, payload);
    const updated = await this.repo.findOne({ where: { id } });
    return this.toDomain(updated!);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async getNextDisplayOrder(serviceId: string): Promise<number> {
    const row = await this.repo
      .createQueryBuilder('r')
      .select('MAX(r.displayOrder)', 'max')
      .where('r.serviceId = :serviceId', { serviceId })
      .getRawOne<{ max: string | null }>();
    const max = row?.max != null ? Number(row.max) : NaN;
    return Number.isFinite(max) ? max + 1 : 0;
  }

  async countWhereIdsIn(serviceId: string, ids: string[]): Promise<number> {
    if (!ids.length) return 0;
    return this.repo.count({
      where: { serviceId, id: In(ids) },
    });
  }

  async reorder(serviceId: string, orderedIds: string[]): Promise<void> {
    await Promise.all(
      orderedIds.map((id, index) =>
        this.repo.update({ id, serviceId }, { displayOrder: index }),
      ),
    );
  }

  private toDomain(entity: ServiceVoiceReviewEntity): ServiceVoiceReview {
    return new ServiceVoiceReview({
      id: entity.id,
      serviceId: entity.serviceId,
      reviewerName: entity.reviewerName,
      audioUrl: entity.audioUrl,
      transcript: entity.transcript,
      transcriptAr: entity.transcriptAr,
      rating: entity.rating,
      displayOrder: entity.displayOrder,
      isVisible: entity.isVisible,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }
}
