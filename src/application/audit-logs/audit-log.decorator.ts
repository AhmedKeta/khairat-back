import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditLogOptions {
  action?: string;
  entity?: string;
  skipAutoLog?: boolean;
}

export const AuditLog = (options: AuditLogOptions) =>
  SetMetadata(AUDIT_LOG_KEY, options);
