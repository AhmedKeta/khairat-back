import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
