import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { VerifyCallback } from 'passport-oauth2';
import { TenantRequest } from '../../common/interfaces/tenant-request.interface';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') ?? (() => { throw new Error('GOOGLE_CLIENT_ID is not set'); })(),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') ?? (() => { throw new Error('GOOGLE_CLIENT_SECRET is not set'); })(),
      callbackURL: configService.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost/api/auth/google/callback',
      ),
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  private maskEmail(email?: string | null) {
    if (!email) {
      return '';
    }

    return email.replace(/^(.{2}).*(@.*)$/, '$1***$2');
  }

  private maskGoogleId(googleId?: string | null) {
    if (!googleId) {
      return '';
    }

    return `***${googleId.slice(-4)}`;
  }

  async validate(
    req: TenantRequest,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    this.logger.log(
      `[auth][googleStrategy] validate start ${JSON.stringify({
        clinicId: req.tenant?.clinicId,
        googleId: this.maskGoogleId(profile.id),
        email: this.maskEmail(profile.emails?.[0]?.value ?? ''),
      })}`,
    );

    const clinicId = req.tenant?.clinicId;
    if (!clinicId) {
      this.logger.error('[auth][googleStrategy] tenant context missing');
      return done(new Error('Tenant context missing'), false);
    }

    const googleId = profile.id;
    const email = profile.emails?.[0]?.value ?? '';
    const firstName = profile.name?.givenName ?? '';
    const lastName = profile.name?.familyName ?? '';
    const avatar = profile.photos?.[0]?.value ?? '';

    try {
      const result = await this.authService.googleLogin({
        googleId,
        email,
        firstName,
        lastName,
        avatar,
      }, clinicId, {
        ipAddress:
          req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
          req.headers['x-real-ip']?.toString() ||
          req.ip,
        requestId: (req as any).requestId,
        userAgent: this.getUserAgent(req),
        trustedDeviceToken: this.getTrustedDeviceToken(req),
      });

      this.logger.log(
        `[auth][googleStrategy] validate success ${JSON.stringify({
          clinicId,
          email: this.maskEmail(email),
          googleId: this.maskGoogleId(googleId),
          requiresOtp: 'requiresOtp' in result ? result.requiresOtp : false,
        })}`,
      );
      done(null, result);
    } catch (error) {
      this.logger.error(
        `[auth][googleStrategy] validate failed ${JSON.stringify({
          clinicId,
          email: this.maskEmail(email),
          googleId: this.maskGoogleId(googleId),
          errorName: error instanceof Error ? error.name : 'UnknownError',
        })}`,
      );
      done(error as Error, false);
    }
  }

  private getTrustedDeviceToken(req: TenantRequest) {
    const cookieHeader = req.headers.cookie;

    if (!cookieHeader) {
      return undefined;
    }

    const cookies = cookieHeader.split(';').map((part) => part.trim());
    const trustedCookie = cookies.find((cookie) =>
      cookie.startsWith('trusted_device_token='),
    );

    if (!trustedCookie) {
      return undefined;
    }

    return decodeURIComponent(trustedCookie.split('=').slice(1).join('='));
  }

  private getUserAgent(req: TenantRequest) {
    const userAgent = req.headers['user-agent'];
    return Array.isArray(userAgent) ? userAgent[0] : userAgent;
  }
}
