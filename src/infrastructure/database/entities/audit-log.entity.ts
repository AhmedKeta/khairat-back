import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity({ name: 'audit_log' })
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  userId?: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  userEmail?: string | null;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  action: string;

  @Column({ type: 'varchar', length: 100 })
  @Index()
  entity: string;

  @Column({ type: 'varchar', nullable: true })
  @Index()
  entityId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  oldValues?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  newValues?: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress?: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  endpoint?: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  method?: string | null;

  @Column({ type: 'int', nullable: true })
  @Index()
  statusCode?: number | null;

  @Column({ type: 'int', nullable: true })
  @Index()
  duration?: number | null;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  errorCode?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  correlationId?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  country?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  countryCode?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @Index()
  deviceType?: string | null;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
