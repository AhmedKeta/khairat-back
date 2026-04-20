import { Injectable, Logger, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogEntity } from '../../infrastructure/database/entities/audit-log.entity';
import { UserEntity } from '../../infrastructure/database/entities/user.entity';
import { AuditLogService } from './audit-log.service';
import { AuditLogInterceptor } from './audit-log.interceptor';

@Injectable()
class AuditLogsStartupHook implements OnModuleInit {
  private readonly logger = new Logger(AuditLogsStartupHook.name);

  onModuleInit(): void {
    this.logger.log(
      'Audit list API: GET /api/v1/users/admin/audit-logs (admin JWT)',
    );
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity, UserEntity])],
  providers: [
    AuditLogService,
    AuditLogsStartupHook,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
  exports: [AuditLogService],
})
export class AuditLogsModule {}
