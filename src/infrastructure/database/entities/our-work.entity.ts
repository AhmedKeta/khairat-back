import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('our_works')
export class OurWorkEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ name: 'title_ar', type: 'text', nullable: true })
  titleAr: string | null;

  @Column({ name: 'image_url' })
  imageUrl: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'is_visible', default: true })
  isVisible: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
