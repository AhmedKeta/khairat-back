export class ServiceVoiceReview {
  id: string;
  serviceId: string;
  reviewerName: string;
  audioUrl: string;
  transcript: string | null;
  transcriptAr: string | null;
  rating: number;
  displayOrder: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<ServiceVoiceReview>) {
    Object.assign(this, partial);
  }
}
