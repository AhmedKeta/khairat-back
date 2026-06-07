import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ServiceMarkAssignmentEntity } from './service-mark-assignment.entity';

@Entity('service_marks')
export class ServiceMarkEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  name: { ar: string; en: string };

  @Column({ unique: true })
  slug: string;

  @Column({ name: 'background_color', length: 7 })
  backgroundColor: string;

  @Column({ name: 'text_color', length: 7 })
  textColor: string;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => ServiceMarkAssignmentEntity, (assignment) => assignment.mark)
  assignments: ServiceMarkAssignmentEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
