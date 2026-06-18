import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ServiceEntity } from './service.entity';

@Entity('service_voice_reviews')
export class ServiceVoiceReviewEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'service_id', type: 'uuid' })
  serviceId: string;

  @ManyToOne(() => ServiceEntity, (service) => service.voiceReviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'service_id' })
  service?: ServiceEntity;

  @Column({ name: 'reviewer_name' })
  reviewerName: string;

  @Column({ name: 'audio_url', type: 'text' })
  audioUrl: string;

  @Column({ type: 'text', nullable: true })
  transcript: string | null;

  @Column({ name: 'transcript_ar', type: 'text', nullable: true })
  transcriptAr: string | null;

  @Column({ type: 'int', default: 5 })
  rating: number;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @Column({ name: 'is_visible', default: true })
  isVisible: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
