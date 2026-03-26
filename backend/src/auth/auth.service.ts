import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { and, eq, sql } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuditService } from '../audit/audit.service';
import { users, patients } from '../database/schema';
import { RedisService } from '../redis/redis.service';

interface RequestContext {
  ipAddress?: string;
  requestId?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject('DRIZZLE') private readonly db: any,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto, clinicId: string, ctx?: RequestContext) {
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, dto.email), eq(users.clinic_id, clinicId)))
      .limit(1);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    if (!dto.kvkkConsent) {
      throw new BadRequestException('KVKK consent is required');
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
        kvkk_consent_at: new Date(),
        kvkk_consent_version: '1.0',
        kvkk_consent_ip: null,
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
      user.role,
      user.clinic_id,
    );

    this.auditService.log({
      clinicId,
      userId: user.id,
      userRole: user.role,
      action: 'REGISTER',
      entity: 'auth',
      entityId: user.id,
      ipAddress: ctx?.ipAddress,
      requestId: ctx?.requestId,
    });

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
        avatar_url: user.avatar_url,
      },
    };
  }

  async login(dto: LoginDto, clinicId: string, ctx?: RequestContext) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, dto.email), eq(users.clinic_id, clinicId)))
      .limit(1);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.locked_until && user.locked_until > new Date()) {
      this.auditService.log({
        clinicId,
        userId: user.id,
        action: 'LOGIN_FAILED',
        entity: 'auth',
        ipAddress: ctx?.ipAddress,
        requestId: ctx?.requestId,
        metadata: { email: dto.email, reason: 'account_locked' },
      });

      throw new UnauthorizedException(
        'Account is temporarily locked. Try again later.',
      );
    }

    if (!user.password_hash) {
      throw new UnauthorizedException('Use Google login');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      const newAttempts = user.failed_login_attempts + 1;

      await this.db
        .update(users)
        .set({
          failed_login_attempts: sql`${users.failed_login_attempts} + 1`,
          locked_until:
            newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : undefined,
        })
        .where(eq(users.id, user.id));

      this.auditService.log({
        clinicId,
        action: 'LOGIN_FAILED',
        entity: 'auth',
        ipAddress: ctx?.ipAddress,
        requestId: ctx?.requestId,
        metadata: { email: dto.email, reason: 'invalid_password' },
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.failed_login_attempts > 0) {
      await this.db
        .update(users)
        .set({ failed_login_attempts: 0, locked_until: null })
        .where(eq(users.id, user.id));
    }

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.role,
      user.clinic_id,
    );

    this.auditService.log({
      clinicId,
      userId: user.id,
      userRole: user.role,
      action: 'LOGIN_SUCCESS',
      entity: 'auth',
      entityId: user.id,
      ipAddress: ctx?.ipAddress,
      requestId: ctx?.requestId,
    });

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
        avatar_url: user.avatar_url,
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
      user.role,
      user.clinic_id,
    );

    this.auditService.log({
      clinicId: user.clinic_id,
      userId: user.id,
      userRole: user.role,
      action: 'TOKEN_REFRESH',
      entity: 'auth',
      entityId: user.id,
    });

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
      avatar_url: user.avatar_url,
    };
  }

  async googleLogin(googleUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
  }, clinicId: string) {
    console.log('[auth][googleLogin] start', {
      clinicId,
    });

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
      console.log('[auth][googleLogin] found existing google user', {
        userId: googleUserRecord.id,
        role: googleUserRecord.role,
      });
      const normalizedGoogleUser = await this.ensureGooglePatientUser(
        googleUserRecord,
        clinicId,
        googleUser.avatar,
      );

      const { accessToken, refreshToken } = await this.generateTokens(
        normalizedGoogleUser.id,
        normalizedGoogleUser.role,
        normalizedGoogleUser.clinic_id,
      );

      this.auditService.log({
        clinicId,
        userId: normalizedGoogleUser.id,
        userRole: normalizedGoogleUser.role,
        action: 'LOGIN_SUCCESS',
        entity: 'auth',
        metadata: { provider: 'google' },
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: normalizedGoogleUser.id,
          email: normalizedGoogleUser.email,
          firstName: normalizedGoogleUser.first_name,
          lastName: normalizedGoogleUser.last_name,
          role: normalizedGoogleUser.role,
          clinicId: normalizedGoogleUser.clinic_id,
          avatar_url: normalizedGoogleUser.avatar_url,
        },
      };
    }

    const [emailUser] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, googleUser.email), eq(users.clinic_id, clinicId)))
      .limit(1);

    if (emailUser) {
      console.log('[auth][googleLogin] found existing user by email', {
        userId: emailUser.id,
        role: emailUser.role,
        hasPassword: Boolean(emailUser.password_hash),
      });
      const [updatedUser] = await this.db
        .update(users)
        .set({
          role: emailUser.password_hash ? emailUser.role : 'patient',
          google_id: googleUser.googleId,
          avatar_url: this.shouldUseGoogleAvatar(emailUser.avatar_url, googleUser.avatar)
            ? googleUser.avatar
            : emailUser.avatar_url,
          updated_at: new Date(),
        })
        .where(eq(users.id, emailUser.id))
        .returning();

      if (updatedUser.role === 'patient') {
        console.log('[auth][googleLogin] ensuring patient profile for email-matched user', {
          userId: updatedUser.id,
          role: updatedUser.role,
        });
        await this.ensurePatientProfile(updatedUser, clinicId);
      }

      const { accessToken, refreshToken } = await this.generateTokens(
        updatedUser.id,
        updatedUser.role,
        updatedUser.clinic_id,
      );

      this.auditService.log({
        clinicId,
        userId: updatedUser.id,
        userRole: updatedUser.role,
        action: 'LOGIN_SUCCESS',
        entity: 'auth',
        metadata: { provider: 'google' },
      });

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
          avatar_url: updatedUser.avatar_url,
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
        role: 'patient',
        google_id: googleUser.googleId,
        avatar_url: googleUser.avatar,
      })
      .returning();

    console.log('[auth][googleLogin] created new google user', {
      userId: newUser.id,
      role: newUser.role,
    });
    await this.ensurePatientProfile(newUser, clinicId);

    const { accessToken, refreshToken } = await this.generateTokens(
      newUser.id,
      newUser.role,
      newUser.clinic_id,
    );

    this.auditService.log({
      clinicId,
      userId: newUser.id,
      userRole: newUser.role,
      action: 'LOGIN_SUCCESS',
      entity: 'auth',
      metadata: { provider: 'google' },
    });

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
        avatar_url: newUser.avatar_url,
      },
    };
  }

  private async generateTokens(
    userId: string,
    role: string,
    clinicId: string,
  ) {
    const accessToken = this.jwtService.sign({
      sub: userId,
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

  private async ensureGooglePatientUser(
    user: typeof users.$inferSelect,
    clinicId: string,
    googleAvatar?: string,
  ) {
    let nextUser = user;

    if (user.role === 'staff' && !user.password_hash) {
      console.log('[auth][googleLogin] converting social-only staff user to patient', {
        userId: user.id,
      });
      const [updatedUser] = await this.db
        .update(users)
        .set({
          role: 'patient',
          updated_at: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning();

      nextUser = updatedUser;
    }

    if (this.shouldUseGoogleAvatar(nextUser.avatar_url, googleAvatar)) {
      const [updatedAvatarUser] = await this.db
        .update(users)
        .set({
          avatar_url: googleAvatar,
          updated_at: new Date(),
        })
        .where(eq(users.id, nextUser.id))
        .returning();

      nextUser = updatedAvatarUser;
    }

    if (nextUser.role === 'patient') {
      console.log('[auth][googleLogin] ensuring patient profile for google user', {
        userId: nextUser.id,
      });
      await this.ensurePatientProfile(nextUser, clinicId);
    }

    return nextUser;
  }

  private shouldUseGoogleAvatar(currentAvatar?: string | null, googleAvatar?: string | null) {
    if (!googleAvatar) {
      return false;
    }

    if (!currentAvatar) {
      return true;
    }

    return currentAvatar.includes('googleusercontent.com');
  }

  private async ensurePatientProfile(
    user: typeof users.$inferSelect,
    clinicId: string,
  ) {
    console.log('[auth][googleLogin] ensurePatientProfile start', {
      userId: user.id,
      clinicId,
    });

    const [existingPatient] = await this.db
      .select()
      .from(patients)
      .where(and(eq(patients.user_id, user.id), eq(patients.clinic_id, clinicId)))
      .limit(1);

    if (existingPatient) {
      console.log('[auth][googleLogin] patient profile already exists', {
        patientId: existingPatient.id,
        userId: user.id,
      });
      return existingPatient;
    }

    try {
      const [patient] = await this.db
        .insert(patients)
        .values({
          clinic_id: clinicId,
          user_id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
        })
        .returning();

      console.log('[auth][googleLogin] patient profile created', {
        patientId: patient.id,
        userId: user.id,
      });
      return patient;
    } catch (error) {
      console.error('[auth][googleLogin] ensurePatientProfile failed', {
        userId: user.id,
        clinicId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
