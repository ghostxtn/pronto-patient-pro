import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'crypto';
import { AuditService } from '../../audit/audit.service';
import { AUDIT_KEY, AuditMetadata } from '../decorators/audit.decorator';

export const SKIP_AUDIT_KEY = 'skipAudit';
export const SkipAudit = () => SetMetadata(SKIP_AUDIT_KEY, true);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const shouldSkipAudit = this.reflector.getAllAndOverride<boolean>(
      SKIP_AUDIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (shouldSkipAudit || ['GET', 'HEAD'].includes(request.method)) {
      return next.handle();
    }

    const auditMeta = this.reflector.getAllAndOverride<AuditMetadata>(
      AUDIT_KEY,
      [context.getHandler(), context.getClass()],
    );
    const user = request.user;
    const requestId = (request as any).requestId || randomUUID();

    return next.handle().pipe(
      tap((responseBody) => {
        let entityId: string | undefined;
        let action: string;
        let entity: string;

        if (auditMeta) {
          action = auditMeta.action;
          entity = auditMeta.entity;

          if (responseBody?.id) {
            entityId = responseBody.id;
          } else if (request.params?.id) {
            entityId = request.params.id;
          }
        } else {
          action = `${request.method} ${request.path}`;
          entity = 'unknown';
        }

        const ipAddress =
          request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
          request.headers['x-real-ip'] ||
          request.ip;

        this.auditService.log({
          clinicId: user?.clinicId,
          userId: user?.userId,
          userRole: user?.role,
          action,
          entity,
          entityId,
          ipAddress,
          requestId,
          metadata: {
            method: request.method,
            path: request.url,
            params: request.params,
          },
        });
      }),
    );
  }
}
