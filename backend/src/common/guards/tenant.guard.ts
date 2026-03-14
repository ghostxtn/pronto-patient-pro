import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantRequest } from '../interfaces/tenant-request.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.get<boolean>(
      IS_PUBLIC_KEY,
      context.getHandler(),
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<TenantRequest>();
    const user = request.user;

    if (!user) {
      return true;
    }

    const clinicId = user.clinicId;
    if (!clinicId) {
      return true;
    }

    if (
      request.params?.id &&
      typeof request.path === 'string' &&
      request.path.includes('/clinics') &&
      request.params.id !== clinicId
    ) {
      throw new ForbiddenException('Access denied to this clinic');
    }

    if (
      request.body?.clinicId &&
      request.body.clinicId !== clinicId
    ) {
      throw new ForbiddenException('Access denied to this clinic');
    }

    if (
      request.tenant &&
      request.tenant.clinicId !== clinicId
    ) {
      throw new ForbiddenException('Access denied to this clinic');
    }

    request.tenantId = clinicId;
    return true;
  }
}
