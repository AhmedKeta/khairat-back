export class CreateAuditLogDto {
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  endpoint?: string | null;
  method?: string | null;
  statusCode?: number | null;
  duration?: number | null;
  errorMessage?: string | null;
  errorCode?: string | null;
  correlationId?: string | null;
  country?: string | null;
  city?: string | null;
  countryCode?: string | null;
  deviceType?: string | null;
}
