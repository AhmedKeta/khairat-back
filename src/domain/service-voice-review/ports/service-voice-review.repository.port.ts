import { ServiceVoiceReview } from '../entities/service-voice-review.entity';

export abstract class ServiceVoiceReviewRepositoryPort {
  abstract findByServiceId(
    serviceId: string,
    options?: { visibleOnly?: boolean },
  ): Promise<ServiceVoiceReview[]>;

  abstract findById(id: string): Promise<ServiceVoiceReview | null>;

  abstract create(
    data: Partial<ServiceVoiceReview>,
  ): Promise<ServiceVoiceReview>;

  abstract update(
    id: string,
    data: Partial<ServiceVoiceReview>,
  ): Promise<ServiceVoiceReview>;

  abstract delete(id: string): Promise<void>;

  abstract getNextDisplayOrder(serviceId: string): Promise<number>;

  abstract countWhereIdsIn(serviceId: string, ids: string[]): Promise<number>;

  abstract reorder(serviceId: string, orderedIds: string[]): Promise<void>;
}
