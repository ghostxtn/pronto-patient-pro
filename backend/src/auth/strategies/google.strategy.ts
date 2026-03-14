import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { VerifyCallback } from 'passport-oauth2';
import { TenantRequest } from '../../common/interfaces/tenant-request.interface';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID', 'placeholder'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET', 'placeholder'),
      callbackURL: configService.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost/api/auth/google/callback',
      ),
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: TenantRequest,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const clinicId = req.tenant?.clinicId;
    if (!clinicId) {
      return done(new Error('Tenant context missing'), false);
    }

    const googleId = profile.id;
    const email = profile.emails?.[0]?.value ?? '';
    const firstName = profile.name?.givenName ?? '';
    const lastName = profile.name?.familyName ?? '';
    const avatar = profile.photos?.[0]?.value ?? '';

    const result = await this.authService.googleLogin({
      googleId,
      email,
      firstName,
      lastName,
      avatar,
    }, clinicId);

    done(null, result);
  }
}
