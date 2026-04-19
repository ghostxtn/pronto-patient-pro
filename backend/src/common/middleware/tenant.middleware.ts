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
  private static readonly TRUSTED_PROXIES = [
    '127.0.0.1',
    '::1',
    '::ffff:127.0.0.1',
  ];

  constructor(
    private readonly tenantResolverService: TenantResolverService,
    private readonly configService: ConfigService,
  ) {}

  async use(
    request: TenantRequest,
    _response: Response,
    next: NextFunction,
  ) {
    const forwardedHost = request.headers['x-forwarded-host'];
    const isTrustedProxy = TenantMiddleware.TRUSTED_PROXIES.includes(
      request.socket.remoteAddress ?? '',
    );
    const trustedForwardedHost = isTrustedProxy
      ? (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost)
          ?.split(',')[0]
          ?.trim()
      : null;
    const rawHost = trustedForwardedHost ?? request.headers.host;

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
