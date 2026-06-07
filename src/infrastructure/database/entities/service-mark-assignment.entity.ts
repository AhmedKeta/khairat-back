import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { ServiceEntity } from './service.entity';
import { ServiceMarkEntity } from './service-mark.entity';

@Entity('service_mark_assignments')
export class ServiceMarkAssignmentEntity {
  @PrimaryColumn({ name: 'service_id', type: 'uuid' })
  serviceId: string;

  @PrimaryColumn({ name: 'mark_id', type: 'uuid' })
  markId: string;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @ManyToOne(() => ServiceEntity, (service) => service.markAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'service_id' })
  service: ServiceEntity;

  @ManyToOne(() => ServiceMarkEntity, (mark) => mark.assignments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'mark_id' })
  mark: ServiceMarkEntity;
}
