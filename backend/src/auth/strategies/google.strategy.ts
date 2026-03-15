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
      clientID: configService.get<string>('GOOGLE_CLIENT_ID', '443771828527-25b30fovsvcrqg9717g4r3le1119f4kb.apps.googleusercontent.com'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET', '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'),
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
    console.log('[auth][googleStrategy] validate start', {
      clinicId: req.tenant?.clinicId,
      googleId: profile.id,
      email: profile.emails?.[0]?.value ?? '',
    });

    const clinicId = req.tenant?.clinicId;
    if (!clinicId) {
      console.error('[auth][googleStrategy] tenant context missing');
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
      }, clinicId);

      console.log('[auth][googleStrategy] validate success', {
        email,
        role: result.user?.role,
      });
      done(null, result);
    } catch (error) {
      console.error('[auth][googleStrategy] validate failed', error);
      done(error as Error, false);
    }
  }
}
