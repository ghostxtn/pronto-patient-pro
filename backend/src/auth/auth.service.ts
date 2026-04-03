import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { and, eq, sql } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, randomInt, randomUUID } from 'crypto';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResendAuthOtpDto } from './dto/resend-auth-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyAuthOtpDto } from './dto/verify-auth-otp.dto';
import { AuditService } from '../audit/audit.service';
import { users, patients } from '../database/schema';

interface RequestContext {
  ipAddress?: string;
  requestId?: string;
}

type OtpFlowPurpose = 'login' | 'register' | 'google';

interface OtpFlowPayload {
  purpose: OtpFlowPurpose;
  clinicId: string;
  email: string;
  codeHash: string;
  expiresAt: string;
  attemptsRemaining: number;
  userId?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  kvkkConsent?: boolean;
}

const OTP_LENGTH = 6;
const OTP_TTL_SECONDS = 10 * 60;
const OTP_MAX_ATTEMPTS = 5;
const PASSWORD_RESET_TOKEN_BYTES = 32;
const DEFAULT_PASSWORD_RESET_TTL_MINUTES = 60;

@Injectable()
export class AuthService {
  constructor(
    @Inject('DRIZZLE') private readonly db: any,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
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

    return this.createOtpChallenge(
      {
        purpose: 'register',
        clinicId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        kvkkConsent: dto.kvkkConsent,
      },
      ctx,
    );
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
            newAttempts >= 10 ? new Date(Date.now() + 15 * 60 * 1000) : undefined,
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

    return this.createOtpChallenge(
      {
        purpose: 'login',
        clinicId,
        email: user.email,
        userId: user.id,
      },
      ctx,
    );
  }

  async verifyOtp(dto: VerifyAuthOtpDto, clinicId: string, ctx?: RequestContext) {
    const flow = await this.getOtpFlow(dto.flowToken);

    if (flow.clinicId !== clinicId) {
      throw new UnauthorizedException('Invalid verification flow');
    }

    if (new Date(flow.expiresAt) < new Date()) {
      await this.redisService.deleteValue(this.getOtpKey(dto.flowToken));
      throw new UnauthorizedException('Verification code expired');
    }

    if (this.hashOtpCode(dto.code) !== flow.codeHash) {
      const attemptsRemaining = flow.attemptsRemaining - 1;

      if (attemptsRemaining <= 0) {
        await this.redisService.deleteValue(this.getOtpKey(dto.flowToken));
        throw new UnauthorizedException('Too many invalid verification attempts');
      }

      await this.saveOtpFlow(dto.flowToken, {
        ...flow,
        attemptsRemaining,
      });

      throw new UnauthorizedException('Invalid verification code');
    }

    await this.redisService.deleteValue(this.getOtpKey(dto.flowToken));

    if (flow.purpose === 'register') {
      return this.completeRegistrationFlow(flow, ctx);
    }

    return this.completeExistingUserFlow(flow, ctx);
  }

  async resendOtp(dto: ResendAuthOtpDto, clinicId: string, ctx?: RequestContext) {
    const flow = await this.getOtpFlow(dto.flowToken);

    if (flow.clinicId !== clinicId) {
      throw new UnauthorizedException('Invalid verification flow');
    }

    const code = this.generateOtpCode();

    await this.saveOtpFlow(dto.flowToken, {
      ...flow,
      codeHash: this.hashOtpCode(code),
      expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString(),
      attemptsRemaining: OTP_MAX_ATTEMPTS,
    });

    await this.emailService.sendAuthOtp(flow.email, code);

    this.auditService.log({
      clinicId,
      action: 'OTP_RESENT',
      entity: 'auth',
      ipAddress: ctx?.ipAddress,
      requestId: ctx?.requestId,
      metadata: { email: flow.email, purpose: flow.purpose },
    });

    return this.buildOtpChallengeResponse(dto.flowToken, flow.email);
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
    clinicId: string,
    frontendUrl: string,
    ctx?: RequestContext,
  ) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, dto.email), eq(users.clinic_id, clinicId)))
      .limit(1);

    if (!user) {
      this.auditService.log({
        clinicId,
        action: 'PASSWORD_RESET_REQUESTED',
        entity: 'auth',
        ipAddress: ctx?.ipAddress,
        requestId: ctx?.requestId,
        metadata: { email: dto.email, userExists: false },
      });

      return this.buildForgotPasswordResponse();
    }

    const resetToken = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('hex');
    const resetTokenHash = this.hashResetToken(resetToken);
    const expiresInMinutes = this.getPasswordResetTtlMinutes();
    const passwordResetExpiresAt = new Date(
      Date.now() + expiresInMinutes * 60 * 1000,
    );
    const resetLink = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(resetToken)}`;

    await this.db
      .update(users)
      .set({
        password_reset_token_hash: resetTokenHash,
        password_reset_expires_at: passwordResetExpiresAt,
        updated_at: new Date(),
      })
      .where(eq(users.id, user.id));

    await this.emailService.sendPasswordReset(user.email, resetLink, expiresInMinutes);

    this.auditService.log({
      clinicId,
      userId: user.id,
      userRole: user.role,
      action: 'PASSWORD_RESET_REQUESTED',
      entity: 'auth',
      entityId: user.id,
      ipAddress: ctx?.ipAddress,
      requestId: ctx?.requestId,
      metadata: { email: user.email },
    });

    return this.buildForgotPasswordResponse();
  }

  async resetPassword(
    dto: ResetPasswordDto,
    clinicId: string,
    ctx?: RequestContext,
  ) {
    const tokenHash = this.hashResetToken(dto.token);
    const [user] = await this.db
      .select()
      .from(users)
      .where(
        and(
          eq(users.password_reset_token_hash, tokenHash),
          eq(users.clinic_id, clinicId),
        ),
      )
      .limit(1);

    if (!user || !user.password_reset_expires_at) {
      throw new UnauthorizedException('Invalid or expired password reset token');
    }

    if (user.password_reset_expires_at <= new Date()) {
      await this.clearPasswordResetToken(user.id);
      throw new UnauthorizedException('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.db
      .update(users)
      .set({
        password_hash: passwordHash,
        password_reset_token_hash: null,
        password_reset_expires_at: null,
        failed_login_attempts: 0,
        locked_until: null,
        updated_at: new Date(),
      })
      .where(eq(users.id, user.id));

    await this.redisService.deleteRefreshToken(user.id);

    this.auditService.log({
      clinicId,
      userId: user.id,
      userRole: user.role,
      action: 'PASSWORD_RESET_COMPLETED',
      entity: 'auth',
      entityId: user.id,
      ipAddress: ctx?.ipAddress,
      requestId: ctx?.requestId,
    });

    return { message: 'Password reset successful' };
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

      return this.createOtpChallenge({
        purpose: 'google',
        clinicId,
        email: normalizedGoogleUser.email,
        userId: normalizedGoogleUser.id,
      });
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

      return this.createOtpChallenge({
        purpose: 'google',
        clinicId,
        email: updatedUser.email,
        userId: updatedUser.id,
      });
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

    return this.createOtpChallenge({
      purpose: 'google',
      clinicId,
      email: newUser.email,
      userId: newUser.id,
    });
  }

  private async createOtpChallenge(
    payload: Omit<OtpFlowPayload, 'codeHash' | 'expiresAt' | 'attemptsRemaining'>,
    ctx?: RequestContext,
  ) {
    const flowToken = randomUUID();
    const code = this.generateOtpCode();

    await this.saveOtpFlow(flowToken, {
      ...payload,
      codeHash: this.hashOtpCode(code),
      expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString(),
      attemptsRemaining: OTP_MAX_ATTEMPTS,
    });

    await this.emailService.sendAuthOtp(payload.email, code);

    this.auditService.log({
      clinicId: payload.clinicId,
      userId: payload.userId,
      action: 'OTP_SENT',
      entity: 'auth',
      ipAddress: ctx?.ipAddress,
      requestId: ctx?.requestId,
      metadata: { email: payload.email, purpose: payload.purpose },
    });

    return this.buildOtpChallengeResponse(flowToken, payload.email);
  }

  private buildOtpChallengeResponse(flowToken: string, email: string) {
    return {
      requiresOtp: true,
      flowToken,
      email,
      expiresInSeconds: OTP_TTL_SECONDS,
    };
  }

  private buildForgotPasswordResponse() {
    return {
      message: 'If an account exists, a reset link has been sent.',
    };
  }

  private async completeRegistrationFlow(
    flow: OtpFlowPayload,
    ctx?: RequestContext,
  ) {
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, flow.email), eq(users.clinic_id, flow.clinicId)))
      .limit(1);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const [user] = await this.db
      .insert(users)
      .values({
        email: flow.email,
        password_hash: flow.passwordHash!,
        first_name: flow.firstName!,
        last_name: flow.lastName!,
        clinic_id: flow.clinicId,
        role: 'patient',
        kvkk_consent_at: flow.kvkkConsent ? new Date() : null,
        kvkk_consent_version: flow.kvkkConsent ? '1.0' : null,
        kvkk_consent_ip: null,
      })
      .returning();

    await this.db.insert(patients).values({
      clinic_id: flow.clinicId,
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    });

    const authResult = await this.issueTokensForUser(user);

    this.auditService.log({
      clinicId: flow.clinicId,
      userId: user.id,
      userRole: user.role,
      action: 'REGISTER',
      entity: 'auth',
      entityId: user.id,
      ipAddress: ctx?.ipAddress,
      requestId: ctx?.requestId,
    });

    this.auditService.log({
      clinicId: flow.clinicId,
      userId: user.id,
      userRole: user.role,
      action: 'LOGIN_SUCCESS',
      entity: 'auth',
      entityId: user.id,
      ipAddress: ctx?.ipAddress,
      requestId: ctx?.requestId,
      metadata: { via: 'otp' },
    });

    return authResult;
  }

  private async completeExistingUserFlow(
    flow: OtpFlowPayload,
    ctx?: RequestContext,
  ) {
    if (!flow.userId) {
      throw new UnauthorizedException('Invalid verification flow');
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, flow.userId), eq(users.clinic_id, flow.clinicId)))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const authResult = await this.issueTokensForUser(user);

    this.auditService.log({
      clinicId: flow.clinicId,
      userId: user.id,
      userRole: user.role,
      action: 'LOGIN_SUCCESS',
      entity: 'auth',
      entityId: user.id,
      ipAddress: ctx?.ipAddress,
      requestId: ctx?.requestId,
      metadata: { via: 'otp', provider: flow.purpose === 'google' ? 'google' : 'password' },
    });

    return authResult;
  }

  private async issueTokensForUser(user: typeof users.$inferSelect) {
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
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
        avatar_url: user.avatar_url,
      },
    };
  }

  private async saveOtpFlow(flowToken: string, payload: OtpFlowPayload) {
    await this.redisService.setValue(
      this.getOtpKey(flowToken),
      JSON.stringify(payload),
      OTP_TTL_SECONDS,
    );
  }

  private async getOtpFlow(flowToken: string): Promise<OtpFlowPayload> {
    const raw = await this.redisService.getValue(this.getOtpKey(flowToken));

    if (!raw) {
      throw new UnauthorizedException('Verification flow not found or expired');
    }

    return JSON.parse(raw) as OtpFlowPayload;
  }

  private getOtpKey(flowToken: string) {
    return `auth:otp:${flowToken}`;
  }

  private generateOtpCode() {
    return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, '0');
  }

  private hashOtpCode(code: string) {
    return createHash('sha256').update(code).digest('hex');
  }

  private hashResetToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getPasswordResetTtlMinutes() {
    const ttlMinutes = Number(
      this.configService.get<string>(
        'PASSWORD_RESET_TTL_MINUTES',
        String(DEFAULT_PASSWORD_RESET_TTL_MINUTES),
      ),
    );

    if (!Number.isFinite(ttlMinutes) || ttlMinutes <= 0) {
      return DEFAULT_PASSWORD_RESET_TTL_MINUTES;
    }

    return ttlMinutes;
  }

  private async clearPasswordResetToken(userId: string) {
    await this.db
      .update(users)
      .set({
        password_reset_token_hash: null,
        password_reset_expires_at: null,
        updated_at: new Date(),
      })
      .where(eq(users.id, userId));
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
