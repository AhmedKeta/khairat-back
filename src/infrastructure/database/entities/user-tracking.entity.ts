import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ name: 'user_tracking' })
export class UserTrackingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'guest_id', type: 'varchar', length: 255, nullable: true })
  @Index()
  guestId?: string | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index()
  userId?: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity | null;

  @Column({ name: 'utm_source', type: 'varchar', length: 512, nullable: true })
  utmSource?: string | null;

  @Column({ name: 'utm_medium', type: 'varchar', length: 512, nullable: true })
  utmMedium?: string | null;

  @Column({ name: 'utm_campaign', type: 'varchar', length: 512, nullable: true })
  utmCampaign?: string | null;

  @Column({ name: 'utm_term', type: 'varchar', length: 512, nullable: true })
  utmTerm?: string | null;

  @Column({ name: 'utm_content', type: 'varchar', length: 512, nullable: true })
  utmContent?: string | null;

  @Column({ name: 'path', type: 'varchar', length: 2048, nullable: true })
  path?: string | null;

  @Column({ name: 'referrer', type: 'varchar', length: 2048, nullable: true })
  referrer?: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
  ipAddress?: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string | null;

  @Column({ name: 'country', type: 'varchar', length: 128, nullable: true })
  country?: string | null;

  @Column({ name: 'location', type: 'varchar', length: 512, nullable: true })
  location?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
