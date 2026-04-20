import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { from, Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import * as geoip from 'geoip-lite';
import { Request } from 'express';
import { AuditLogService } from './audit-log.service';
import { AUDIT_LOG_KEY, AuditLogOptions } from './audit-log.decorator';
import { UserRole } from '../../domain/user/value-objects/user-role.enum';
import { User } from '../../domain/user/entities/user.entity';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private auditLogService: AuditLogService,
    private reflector: Reflector,
    private configService: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request & { user?: User }>();
    const user = request.user;
    const startTime = Date.now();

    const correlationId = this.extractOrGenerateCorrelationId(request);

    if (!this.isDashboardRequest(request)) {
      return next.handle();
    }

    if (!user) {
      return next.handle();
    }

    if (user.role === UserRole.USER) {
      return next.handle();
    }

    if (this.shouldSkipLogging(request.path)) {
      return next.handle();
    }

    const auditLogOptions = this.reflector.getAllAndOverride<AuditLogOptions>(
      AUDIT_LOG_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (auditLogOptions?.skipAutoLog) {
      return next.handle();
    }

    const method = request.method;
    const endpoint = request.path;
    const ipAddress = this.extractIpAddress(request);
    const userAgent = (request.headers['user-agent'] as string) || null;

    const location = ipAddress ? this.extractLocationFromIp(ipAddress) : null;
    const deviceType = userAgent ? this.extractDeviceType(userAgent) : null;

    const { action, entity, entityId } = auditLogOptions
      ? {
          action:
            auditLogOptions.action || this.extractActionFromMethod(method),
          entity:
            auditLogOptions.entity || this.extractEntityFromPath(endpoint),
          entityId: this.extractEntityId(request),
        }
      : this.extractActionAndEntity(method, endpoint, request);

    if (method === 'GET') {
      return next.handle();
    }

    const snapshotPromise =
      method === 'PUT' || method === 'PATCH' || method === 'DELETE'
        ? this.auditLogService.snapshotEntityForAudit(entity, entityId || null)
        : Promise.resolve<Record<string, unknown> | null>(null);

    return from(snapshotPromise).pipe(
      switchMap((oldValues) =>
        next.handle().pipe(
          tap({
            next: async (result) => {
              const duration = Date.now() - startTime;
              const response = context.switchToHttp().getResponse<{ statusCode?: number }>();
              const statusCode = response?.statusCode || 200;

              void this.auditLogService
                .create({
                  userId: user?.id?.toString() || null,
                  userEmail: user?.email || null,
                  action,
                  entity,
                  entityId: entityId || null,
                  ipAddress,
                  userAgent,
                  endpoint,
                  method,
                  statusCode,
                  duration,
                  correlationId,
                  country: location?.country || null,
                  city: location?.city || null,
                  countryCode: location?.countryCode || null,
                  deviceType,
                  oldValues,
                  newValues: this.extractNewValues(result, method),
                })
                .catch((error: Error) => {
                  this.logger.warn(`Failed to create audit log: ${error.message}`);
                });
            },
            error: async (error: unknown) => {
              const duration = Date.now() - startTime;
              const err = error as {
                status?: number;
                response?: { status?: number; data?: { message?: string; error?: string; code?: string; errorCode?: string } };
                message?: string;
                code?: string;
                name?: string;
              };
              const statusCode = err?.status || err?.response?.status || 500;
              const errorMessage = this.extractErrorMessage(error);
              const errorCode = this.extractErrorCode(error);

              void this.auditLogService
                .create({
                  userId: user?.id?.toString() || null,
                  userEmail: user?.email || null,
                  action: `${action}_FAILED`,
                  entity,
                  entityId: entityId || null,
                  ipAddress,
                  userAgent,
                  endpoint,
                  method,
                  statusCode,
                  duration,
                  correlationId,
                  country: location?.country || null,
                  city: location?.city || null,
                  countryCode: location?.countryCode || null,
                  deviceType,
                  errorMessage,
                  errorCode,
                  oldValues,
                  newValues: {
                    error: err?.message ?? String(error),
                  },
                })
                .catch((logError: Error) => {
                  this.logger.warn(
                    `Failed to create audit log for error: ${logError.message}`,
                  );
                });
            },
          }),
        ),
      ),
    );
  }

  private shouldSkipLogging(path: string): boolean {
    const skipPaths = [
      '/health',
      '/api/docs',
      '/api/docs-json',
      '/docs',
      '/docs-json',
      '/public',
      '/favicon.ico',
      '/metrics',
    ];
    return skipPaths.some((skipPath) => path.startsWith(skipPath));
  }

  private extractActionAndEntity(
    method: string,
    endpoint: string,
    request: Request,
  ): { action: string; entity: string; entityId: string | null } {
    const entity = this.extractEntityFromPath(endpoint);
    const entityId = this.extractEntityId(request);
    const action = this.extractActionFromMethod(method);
    return { action, entity, entityId };
  }

  private extractActionFromMethod(method: string): string {
    const actionMap: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
      GET: 'VIEW',
    };
    return actionMap[method] || method;
  }

  private extractEntityFromPath(endpoint: string): string {
    const pathParts = endpoint.split('/').filter(Boolean);

    const apiIndex = pathParts.findIndex((part) => part === 'api');
    let startIndex = 0;

    if (apiIndex >= 0) {
      if (
        apiIndex + 1 < pathParts.length &&
        pathParts[apiIndex + 1]?.match(/^v\d+$/)
      ) {
        startIndex = apiIndex + 2;
      } else {
        startIndex = apiIndex + 1;
      }
    }

    const lastPart = pathParts[pathParts.length - 1];
    const isUuId = lastPart && lastPart.match(/^[0-9a-f-]{36}$/i);
    const isNumericId = lastPart && lastPart.match(/^\d+$/);
    const isId = isUuId || isNumericId;

    let entityPart: string;
    if (isId && pathParts.length > startIndex + 1) {
      let index = pathParts.length - 2;
      while (
        index > startIndex &&
        (pathParts[index].match(/^\d+$/) ||
          pathParts[index].match(/^[0-9a-f-]{36}$/i))
      ) {
        index--;
      }
      entityPart = pathParts[index] || 'Unknown';
    } else if (pathParts.length > startIndex) {
      let index = startIndex;
      while (
        index < pathParts.length - 1 &&
        (pathParts[index].match(/^\d+$/) ||
          pathParts[index].match(/^[0-9a-f-]{36}$/i))
      ) {
        index++;
      }
      entityPart = pathParts[index] || 'Unknown';
    } else {
      entityPart = 'Unknown';
    }

    return this.toEntityName(entityPart);
  }

  private extractEntityId(request: Request): string | null {
    const paramId = request.params?.id as string | undefined;
    const bodyId = (request.body as { id?: string } | undefined)?.id;
    return paramId || bodyId || null;
  }

  private toEntityName(pathPart: string): string {
    const cleanPart = pathPart.split('?')[0].replace(/[0-9a-f-]{36}/gi, '');

    if (!cleanPart || cleanPart === 'Unknown') return 'Unknown';

    let singular = cleanPart;
    if (cleanPart.endsWith('ies')) {
      singular = cleanPart.slice(0, -3) + 'y';
    } else if (
      (cleanPart.endsWith('ches') ||
        cleanPart.endsWith('shes') ||
        cleanPart.endsWith('sses') ||
        cleanPart.endsWith('xes') ||
        cleanPart.endsWith('zes')) &&
      cleanPart.length > 4
    ) {
      singular = cleanPart.slice(0, -2);
    } else if (
      cleanPart.endsWith('s') &&
      !cleanPart.endsWith('ss') &&
      !cleanPart.endsWith('us') &&
      cleanPart.length > 1
    ) {
      singular = cleanPart.slice(0, -1);
    }

    return singular
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join('');
  }

  private extractNewValues(
    result: unknown,
    method: string,
  ): Record<string, unknown> | null {
    if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') {
      return null;
    }

    if (result && typeof result === 'object') {
      return this.limitObjectSize(result as Record<string, unknown>, 51200);
    }

    return null;
  }

  private limitObjectSize(
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
      _summary: 'Response data too large to log',
    };
  }

  private extractIpAddress(request: Request): string | null {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0].trim();
    }
    return (
      (request.socket?.remoteAddress as string) ||
      request.ip ||
      null
    );
  }

  private extractDeviceType(userAgent: string): string | null {
    if (!userAgent) return null;

    const ua = userAgent.toLowerCase();

    const mobilePatterns = [
      /mobile/i,
      /android/i,
      /iphone/i,
      /ipod/i,
      /blackberry/i,
      /windows phone/i,
      /opera mini/i,
      /iemobile/i,
    ];

    const tabletPatterns = [
      /ipad/i,
      /android(?!.*mobile)/i,
      /tablet/i,
      /playbook/i,
      /kindle/i,
      /silk/i,
      /nexus 7/i,
      /nexus 10/i,
      /touchpad/i,
    ];

    for (const pattern of tabletPatterns) {
      if (pattern.test(ua)) {
        return 'Tablet';
      }
    }

    for (const pattern of mobilePatterns) {
      if (pattern.test(ua)) {
        return 'Mobile';
      }
    }

    return 'Desktop';
  }

  private extractLocationFromIp(ipAddress: string): {
    country?: string | null;
    city?: string | null;
    countryCode?: string | null;
  } | null {
    if (!ipAddress) return null;

    try {
      const cleanIp = ipAddress.replace(/^::ffff:/, '').trim();

      if (
        cleanIp === '127.0.0.1' ||
        cleanIp === 'localhost' ||
        cleanIp.startsWith('192.168.') ||
        cleanIp.startsWith('10.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(cleanIp)
      ) {
        return {
          country: 'Local',
          city: 'Local',
          countryCode: 'LOCAL',
        };
      }

      const location = geoip.lookup(cleanIp);

      if (location) {
        return {
          country: location.country || null,
          city: location.city || null,
          countryCode: location.country || null,
        };
      }

      return null;
    } catch (error) {
      this.logger.warn(
        `Failed to extract location from IP ${ipAddress}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private extractOrGenerateCorrelationId(request: Request): string {
    const correlationIdHeaders = [
      'x-request-id',
      'x-correlation-id',
      'x-trace-id',
      'correlation-id',
      'request-id',
    ];

    for (const headerName of correlationIdHeaders) {
      const headerValue = request.headers[headerName];
      if (headerValue && typeof headerValue === 'string') {
        return headerValue;
      }
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${random}`;
  }

  private extractErrorMessage(error: unknown): string | null {
    if (!error) return null;
    const err = error as {
      message?: string;
      response?: { data?: { message?: string; error?: string } };
    };
    if (err.message) return err.message;
    if (err.response?.data?.message) return String(err.response.data.message);
    if (err.response?.data?.error) return String(err.response.data.error);
    if (typeof error === 'string') return error;

    return 'Unknown error';
  }

  private extractErrorCode(error: unknown): string | null {
    if (!error) return null;
    const err = error as {
      code?: string | number;
      response?: { data?: { code?: string; errorCode?: string } };
      name?: string;
      status?: number;
    };
    if (err.code != null) return String(err.code);
    if (err.response?.data?.code != null) {
      return String(err.response.data.code);
    }
    if (err.response?.data?.errorCode != null) {
      return String(err.response.data.errorCode);
    }
    if (err.name) return err.name;

    const status = err?.status || (err as { response?: { status?: number } }).response?.status;
    if (status) {
      if (status >= 400 && status < 500) {
        return 'CLIENT_ERROR';
      }
      if (status >= 500) {
        return 'SERVER_ERROR';
      }
    }

    return null;
  }

  /** Origin as `protocol//host[:port]` (no trailing path). */
  private requestOriginBase(url: string): string | null {
    try {
      const u = new URL(url);
      return `${u.protocol}//${u.host}`;
    } catch {
      return null;
    }
  }

  private isDashboardRequest(request: Request): boolean {
    const dashboardUrl = this.configService.get<string>(
      'DASHBOARD_URL',
      'http://localhost:3002',
    );
    const dashboardBase = this.requestOriginBase(dashboardUrl.trim());
    if (!dashboardBase) {
      return false;
    }

    const originHeader = request.headers.origin;
    if (originHeader) {
      const norm = this.requestOriginBase(originHeader);
      if (norm && norm === dashboardBase) {
        return true;
      }
    }

    const referer = request.headers.referer || request.headers.referrer;
    if (referer) {
      try {
        const refererStr = Array.isArray(referer) ? referer[0] : referer;
        if (!refererStr) {
          return false;
        }
        const refererBase = this.requestOriginBase(refererStr);
        if (refererBase && refererBase === dashboardBase) {
          return true;
        }
      } catch {
        // ignore invalid referer
      }
    }

    return false;
  }
}
