import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { eq } from 'drizzle-orm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { users } from '../../database/schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @Inject('DRIZZLE') private readonly db: any,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user || !user.is_active) {
      throw new UnauthorizedException('Account is disabled');
    }

    return {
      userId: payload.sub,
      role: payload.role,
      clinicId: payload.clinicId,
    };
  }
}
