import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('countries')
export class CountryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true, length: 3 })
  code: string;

  @Column()
  currency: string;

  // Needs to support large multipliers (e.g., IDR).
  @Column({ name: 'price_multiplier', type: 'decimal', precision: 12, scale: 4, default: 1.0 })
  priceMultiplier: number;

  @Column({ name: 'flag_emoji', nullable: true })
  flagEmoji: string;

  @Column({ name: 'phone_code', nullable: true })
  phoneCode: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
