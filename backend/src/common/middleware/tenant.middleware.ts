import {
  Injectable,
  NestMiddleware,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Response } from 'express';
import { TenantRequest } from '../interfaces/tenant-request.interface';
import { TenantResolverService } from '../services/tenant-resolver.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantResolverService: TenantResolverService,
    private readonly configService: ConfigService,
  ) {}

  async use(
    request: TenantRequest,
    _response: Response,
    next: NextFunction,
  ) {
    const clinicDomainHeader = request.headers['x-clinic-domain'];
    const forwardedHost = request.headers['x-forwarded-host'];
    const rawHost =
      (Array.isArray(clinicDomainHeader)
        ? clinicDomainHeader[0]
        : clinicDomainHeader) ||
      (Array.isArray(forwardedHost)
        ? forwardedHost[0]
        : forwardedHost) ||
      request.headers.host;

    let host = rawHost?.toLowerCase().split(':')[0];

    const isDev = this.configService.get<string>('NODE_ENV') !== 'production';

    if (isDev && ['localhost', '127.0.0.1', '[::1]'].includes(host ?? '')) {
      host = 'test-klinik.localhost';
    }

    const clinic = host
      ? await this.tenantResolverService.findClinicByDomain(host)
      : null;

    if (!clinic) {
      throw new NotFoundException('Clinic not found for this domain');
    }

    request.tenant = {
      clinicId: clinic.id,
      clinic,
    };

    next();
  }
}
