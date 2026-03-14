import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { and, eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { users, patients } from '../database/schema';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject('DRIZZLE') private readonly db: any,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, clinicId: string) {
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, dto.email), eq(users.clinic_id, clinicId)))
      .limit(1);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const [user] = await this.db
      .insert(users)
      .values({
        email: dto.email,
        password_hash: passwordHash,
        first_name: dto.firstName,
        last_name: dto.lastName,
        clinic_id: clinicId,
        role: 'patient',
      })
      .returning();

    if (user.role === 'patient') {
      await this.db
        .insert(patients)
        .values({
          clinic_id: clinicId,
          user_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
        });
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.clinic_id,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        clinicId: user.clinic_id,
      },
    };
  }

  async login(dto: LoginDto, clinicId: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, dto.email), eq(users.clinic_id, clinicId)))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.password_hash) {
      throw new UnauthorizedException('Use Google login');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.clinic_id,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        clinicId: user.clinic_id,
      },
    };
  }

  async refreshToken(token: string) {
    let payload: { sub: string };

    try {
      payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedToken = await this.redisService.getRefreshToken(payload.sub);
    if (storedToken !== token) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.redisService.deleteRefreshToken(payload.sub);

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.clinic_id,
    );

    return { accessToken, refreshToken };
  }

  async logout(userId: string) {
    await this.redisService.deleteRefreshToken(userId);
    return { message: 'Logged out' };
  }

  async findById(userId: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      clinicId: user.clinic_id,
    };
  }

  async googleLogin(googleUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
  }, clinicId: string) {
    const [googleUserRecord] = await this.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.google_id, googleUser.googleId),
          eq(users.clinic_id, clinicId),
        ),
      )
      .limit(1);

    if (googleUserRecord) {
      const { accessToken, refreshToken } = await this.generateTokens(
        googleUserRecord.id,
        googleUserRecord.email,
        googleUserRecord.role,
        googleUserRecord.clinic_id,
      );

      return {
        accessToken,
        refreshToken,
        user: {
          id: googleUserRecord.id,
          email: googleUserRecord.email,
          firstName: googleUserRecord.first_name,
          lastName: googleUserRecord.last_name,
          role: googleUserRecord.role,
          clinicId: googleUserRecord.clinic_id,
        },
      };
    }

    const [emailUser] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, googleUser.email), eq(users.clinic_id, clinicId)))
      .limit(1);

    if (emailUser) {
      const [updatedUser] = await this.db
        .update(users)
        .set({
          google_id: googleUser.googleId,
          avatar_url: googleUser.avatar,
          updated_at: new Date(),
        })
        .where(eq(users.id, emailUser.id))
        .returning();

      const { accessToken, refreshToken } = await this.generateTokens(
        updatedUser.id,
        updatedUser.email,
        updatedUser.role,
        updatedUser.clinic_id,
      );

      return {
        accessToken,
        refreshToken,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          role: updatedUser.role,
          clinicId: updatedUser.clinic_id,
        },
      };
    }

    const [newUser] = await this.db
      .insert(users)
      .values({
        email: googleUser.email,
        password_hash: null,
        first_name: googleUser.firstName,
        last_name: googleUser.lastName,
        clinic_id: clinicId,
        role: 'staff',
        google_id: googleUser.googleId,
        avatar_url: googleUser.avatar,
      })
      .returning();

    const { accessToken, refreshToken } = await this.generateTokens(
      newUser.id,
      newUser.email,
      newUser.role,
      newUser.clinic_id,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        clinicId: newUser.clinic_id,
      },
    };
  }

  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    clinicId: string,
  ) {
    const accessToken = this.jwtService.sign({
      sub: userId,
      email,
      role,
      clinicId,
    });

    const refreshToken = this.jwtService.sign(
      { sub: userId },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    await this.redisService.setRefreshToken(userId, refreshToken, 604800);

    return { accessToken, refreshToken };
  }
}
