import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ServiceCategoryEntity } from './service-category.entity';
import { ServiceMarkAssignmentEntity } from './service-mark-assignment.entity';
import { ServiceVoiceReviewEntity } from './service-voice-review.entity';

@Entity('services')
export class ServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  title: { ar: string; en: string };

  @Column({ type: 'jsonb' })
  description: { ar: string; en: string };

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  prices: { currency: string; amount: number }[];

  @Column({ name: 'share_prices', type: 'jsonb', default: () => "'[]'::jsonb" })
  sharePrices: { currency: string; amount: number }[];

  @Column({ name: 'share_description', type: 'jsonb', nullable: true })
  shareDescription: { ar: string; en: string } | null;

  @Column({ name: 'feeds_count', nullable: true, type: 'int' })
  feedsCount: number | null;

  @Column({ type: 'text', array: true, default: [] })
  images: string[];

  @Column({ type: 'text', array: true, default: [] })
  videos: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'polar_product_id', type: 'varchar', nullable: true })
  polarProductId: string | null;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @Column({ name: 'category_id', type: 'uuid', nullable: true })
  categoryId: string | null;

  @ManyToOne(() => ServiceCategoryEntity, (category) => category.services, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category?: ServiceCategoryEntity | null;

  @OneToMany(() => ServiceMarkAssignmentEntity, (assignment) => assignment.service)
  markAssignments?: ServiceMarkAssignmentEntity[];

  @OneToMany(() => ServiceVoiceReviewEntity, (review) => review.service)
  voiceReviews?: ServiceVoiceReviewEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
