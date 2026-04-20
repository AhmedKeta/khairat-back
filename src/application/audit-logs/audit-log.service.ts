import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { AuditLogEntity } from '../../infrastructure/database/entities/audit-log.entity';
import { CountryEntity } from '../../infrastructure/database/entities/country.entity';
import { FaqEntity } from '../../infrastructure/database/entities/faq.entity';
import { OrderEntity } from '../../infrastructure/database/entities/order.entity';
import { PaymentEntity } from '../../infrastructure/database/entities/payment.entity';
import { ServiceEntity } from '../../infrastructure/database/entities/service.entity';
import { TestimonialEntity } from '../../infrastructure/database/entities/testimonial.entity';
import { OurWorkEntity } from '../../infrastructure/database/entities/our-work.entity';
import { UserEntity } from '../../infrastructure/database/entities/user.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { FindAuditLogsDto } from './dto/find-audit-logs.dto';

const AUDIT_SNAPSHOT_ENTITY_MAP: Record<
  string,
  EntityTarget<ObjectLiteral>
> = {
  Service: ServiceEntity,
  User: UserEntity,
  Order: OrderEntity,
  Payment: PaymentEntity,
  Faq: FaqEntity,
  Testimonial: TestimonialEntity,
  Work: OurWorkEntity,
  Country: CountryEntity,
};

const AUDIT_SNAPSHOT_MAX_BYTES = 51200;

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(AuditLogEntity)
    private auditLogRepository: Repository<AuditLogEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Loads current row before mutating handlers run (PUT/PATCH/DELETE) for known entities.
   * Unknown paths or missing rows return null.
   */
  async snapshotEntityForAudit(
    entityName: string,
    entityId: string | null,
  ): Promise<Record<string, unknown> | null> {
    if (!entityId || !entityName || entityName === 'Unknown') {
      return null;
    }

    const Entity = AUDIT_SNAPSHOT_ENTITY_MAP[entityName];
    if (!Entity) {
      return null;
    }

    try {
      const repo = this.dataSource.getRepository(Entity);
      const row = await repo.findOne({
        where: { id: entityId },
      });
      if (!row) {
        return null;
      }

      const plain = JSON.parse(JSON.stringify(row)) as Record<string, unknown>;
      return this.limitSnapshotSize(plain, AUDIT_SNAPSHOT_MAX_BYTES);
    } catch (error) {
      this.logger.warn(
        `Audit entity snapshot failed (${entityName}/${entityId}): ${(error as Error).message}`,
      );
      return null;
    }
  }

  async create(createDto: CreateAuditLogDto): Promise<AuditLogEntity | null> {
    try {
      const sanitizedDto = this.sanitizeData(createDto);
      const auditLog = this.auditLogRepository.create(sanitizedDto);
      return await this.auditLogRepository.save(auditLog);
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${(error as Error).message}`,
        (error as Error).stack,
      );
      return null;
    }
  }

  async findWithCursor(findDto: FindAuditLogsDto): Promise<{
    data: (AuditLogEntity & {
      user?: {
        fullName: string;
        email: string | null;
        role: string;
      } | null;
    })[];
    hasMore: boolean;
    nextCursor: string | null;
  }> {
    try {
      const {
        action,
        entity,
        entityId,
        userId,
        userEmail,
        startDate,
        endDate,
        statusCode,
        success,
        minDuration,
        maxDuration,
        correlationId,
        cursor,
        limit = 50,
      } = findDto;

      const queryBuilder =
        this.auditLogRepository.createQueryBuilder('auditLog');

      if (cursor) {
        const [cursorDate, cursorId] = cursor.split('|');
        if (cursorId) {
          queryBuilder.andWhere(
            '(auditLog.createdAt < :cursorDate OR (auditLog.createdAt = :cursorDate AND auditLog.id < :cursorId))',
            {
              cursorDate: new Date(cursorDate),
              cursorId,
            },
          );
        } else {
          queryBuilder.andWhere('auditLog.createdAt < :cursorDate', {
            cursorDate: new Date(cursorDate),
          });
        }
      }

      if (action) {
        queryBuilder.andWhere('auditLog.action = :action', { action });
      }

      if (statusCode !== undefined) {
        queryBuilder.andWhere('auditLog.statusCode = :statusCode', {
          statusCode,
        });
      }

      if (success !== undefined) {
        if (success) {
          queryBuilder.andWhere(
            '(auditLog.statusCode IS NULL OR auditLog.statusCode < 400)',
          );
        } else {
          queryBuilder.andWhere('auditLog.statusCode >= 400');
        }
      }

      if (minDuration !== undefined) {
        queryBuilder.andWhere('auditLog.duration >= :minDuration', {
          minDuration,
        });
      }
      if (maxDuration !== undefined) {
        queryBuilder.andWhere('auditLog.duration <= :maxDuration', {
          maxDuration,
        });
      }

      if (correlationId) {
        queryBuilder.andWhere('auditLog.correlationId = :correlationId', {
          correlationId,
        });
      }

      if (entity) {
        const variations = [entity];
        const lowerEntity = entity.toLowerCase();
        if (lowerEntity === 'branch') variations.push('branche');
        if (lowerEntity === 'address') variations.push('addresse');
        if (lowerEntity === 'tax') variations.push('taxe');

        queryBuilder.andWhere(
          "(LOWER(REPLACE(auditLog.entity, '-', '')) IN (:...variations) OR LOWER(REPLACE(auditLog.entity, '-', '')) = LOWER(REPLACE(:entity, '-', '')))",
          {
            variations: variations.map((v) =>
              v.toLowerCase().replace(/-/g, ''),
            ),
            entity,
          },
        );
      }
      if (entityId) {
        queryBuilder.andWhere('auditLog.entityId = :entityId', { entityId });
      }
      if (userId) {
        queryBuilder.andWhere('auditLog.userId = :userId', { userId });
      }
      if (userEmail) {
        queryBuilder.andWhere('auditLog.userEmail = :userEmail', { userEmail });
      }
      if (startDate || endDate) {
        queryBuilder.andWhere(
          'auditLog.createdAt BETWEEN :startDate AND :endDate',
          {
            startDate: startDate ? new Date(startDate) : new Date(0),
            endDate: endDate ? new Date(endDate) : new Date(),
          },
        );
      }

      queryBuilder.orderBy('auditLog.createdAt', 'DESC');
      queryBuilder.addOrderBy('auditLog.id', 'DESC');
      queryBuilder.take(limit + 1);

      const rows = await queryBuilder.getMany();

      const hasMore = rows.length > limit;
      const data = hasMore ? rows.slice(0, limit) : rows;

      const enrichedData = await this.enrichWithUserInfo(data);

      const nextCursor =
        hasMore && data.length > 0
          ? `${data[data.length - 1].createdAt.toISOString()}|${data[data.length - 1].id}`
          : null;

      return {
        data: enrichedData,
        hasMore,
        nextCursor,
      };
    } catch (error) {
      this.logger.error(
        `Failed to find audit logs: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  private async enrichWithUserInfo(logs: AuditLogEntity[]): Promise<
    (AuditLogEntity & {
      user?: {
        fullName: string;
        email: string | null;
        role: string;
      } | null;
    })[]
  > {
    if (logs.length === 0) {
      return [];
    }

    const userIds = new Set<string>();
    const userEmails = new Set<string>();

    logs.forEach((log) => {
      if (log.userId) userIds.add(log.userId);
      if (log.userEmail) userEmails.add(log.userEmail);
    });

    const userMap = new Map<string, UserEntity>();

    if (userIds.size > 0) {
      const usersById = await this.userRepository.find({
        where: Array.from(userIds).map((id) => ({ id })),
        select: ['id', 'fullName', 'email', 'role'],
      });
      usersById.forEach((user) => {
        userMap.set(user.id, user);
      });
    }

    if (userEmails.size > 0) {
      const usersByEmail = await this.userRepository.find({
        where: Array.from(userEmails).map((email) => ({ email })),
        select: ['id', 'fullName', 'email', 'role'],
      });
      usersByEmail.forEach((user) => {
        if (user.email) {
          userMap.set(user.email, user);
        }
      });
    }

    return logs.map((log) => {
      let userInfo: UserEntity | null = null;

      if (log.userId) {
        userInfo = userMap.get(log.userId) || null;
      }

      if (!userInfo && log.userEmail) {
        userInfo = userMap.get(log.userEmail) || null;
      }

      return {
        ...log,
        user: userInfo
          ? {
              fullName: userInfo.fullName,
              email: userInfo.email,
              role: userInfo.role,
            }
          : null,
      } as AuditLogEntity & {
        user?: {
          fullName: string;
          email: string | null;
          role: string;
        } | null;
      };
    });
  }

  private sanitizeData(dto: CreateAuditLogDto): CreateAuditLogDto {
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'apiKey',
      'accessToken',
      'refreshToken',
    ];

    const sanitizeObject = (obj: unknown): unknown => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }

      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveFields.some((field) =>
          lowerKey.includes(field),
        );

        if (isSensitive) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    };

    return {
      ...dto,
      oldValues: dto.oldValues
        ? (sanitizeObject(dto.oldValues) as Record<string, unknown>)
        : null,
      newValues: dto.newValues
        ? (sanitizeObject(dto.newValues) as Record<string, unknown>)
        : null,
    };
  }

  private limitSnapshotSize(
    obj: Record<string, unknown>,
    maxSize: number,
  ): Record<string, unknown> {
    const jsonString = JSON.stringify(obj);
    if (jsonString.length <= maxSize) {
      return obj;
    }

    return {
      _truncated: true,
      _originalSize: jsonString.length,
      _summary: 'Snapshot too large to store fully',
    };
  }

  async deleteOldLogs(months: number = 3): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);

      const result = await this.auditLogRepository
        .createQueryBuilder()
        .delete()
        .from(AuditLogEntity)
        .where('createdAt < :cutoffDate', { cutoffDate })
        .execute();

      const deletedCount = result.affected || 0;
      this.logger.log(
        `Deleted ${deletedCount} audit logs older than ${months} months (before ${cutoffDate.toISOString()})`,
      );

      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Failed to delete old audit logs: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }
}
