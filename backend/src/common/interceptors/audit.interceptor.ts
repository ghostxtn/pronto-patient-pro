import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { randomUUID } from 'crypto';
import { AuditService } from '../../audit/audit.service';
import {
  AUDIT_KEY,
  AuditMetadata,
  NO_AUDIT_KEY,
} from '../decorators/audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const noAudit = this.reflector.get<boolean>(NO_AUDIT_KEY, context.getHandler());
    if (noAudit) return next.handle();

    const auditMeta = this.reflector.get<AuditMetadata>(AUDIT_KEY, context.getHandler());
    if (!auditMeta) return next.handle();

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const requestId = (request as any).requestId || randomUUID();

    return next.handle().pipe(
      tap((responseBody) => {
        let entityId: string | undefined;
        if (responseBody?.id) {
          entityId = responseBody.id;
        } else if (request.params?.id) {
          entityId = request.params.id;
        }

        const ipAddress =
          request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
          request.headers['x-real-ip'] ||
          request.ip;

        this.auditService.log({
          clinicId: user?.clinicId,
          userId: user?.userId,
          userRole: user?.role,
          action: auditMeta.action,
          entity: auditMeta.entity,
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
