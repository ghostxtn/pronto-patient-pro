import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { TenantRequest } from '../common/interfaces/tenant-request.interface';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { ResendAuthOtpDto } from './dto/resend-auth-otp.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyAuthOtpDto } from './dto/verify-auth-otp.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const TRUSTED_DEVICE_COOKIE = 'trusted_device_token';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @Public()
  @Throttle({ global: { ttl: 3600000, limit: 10 } })
  @HttpCode(201)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: TenantRequest & Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto, req.tenant!.clinicId, {
      ipAddress:
        req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
        req.headers['x-real-ip']?.toString() ||
        req.ip,
      requestId: (req as any).requestId,
      userAgent: this.getUserAgent(req),
      trustedDeviceToken: this.getTrustedDeviceToken(req),
    });
    this.applyTrustedDeviceCookie(res, (result as any).trustedDeviceToken);
    return result;
  }

  @Post('login')
  @Public()
  @Throttle({ global: { ttl: 60000, limit: 10 } })
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() req: TenantRequest & Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, req.tenant!.clinicId, {
      ipAddress:
        req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
        req.headers['x-real-ip']?.toString() ||
        req.ip,
      requestId: (req as any).requestId,
      userAgent: this.getUserAgent(req),
      trustedDeviceToken: this.getTrustedDeviceToken(req),
    });
    this.applyTrustedDeviceCookie(res, (result as any).trustedDeviceToken);
    return result;
  }

  @Post('refresh')
  @Public()
  @HttpCode(200)
  refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('verify-otp')
  @Public()
  @Throttle({ global: { ttl: 60000, limit: 20 } })
  @HttpCode(200)
  async verifyOtp(
    @Body() dto: VerifyAuthOtpDto,
    @Req() req: TenantRequest & Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOtp(dto, req.tenant!.clinicId, {
      ipAddress:
        req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
        req.headers['x-real-ip']?.toString() ||
        req.ip,
      requestId: (req as any).requestId,
      userAgent: this.getUserAgent(req),
      trustedDeviceToken: this.getTrustedDeviceToken(req),
    });
    this.applyTrustedDeviceCookie(res, (result as any).trustedDeviceToken);
    return result;
  }

  @Post('resend-otp')
  @Public()
  @Throttle({ global: { ttl: 60000, limit: 10 } })
  @HttpCode(200)
  resendOtp(@Body() dto: ResendAuthOtpDto, @Req() req: TenantRequest & Request) {
    return this.authService.resendOtp(dto, req.tenant!.clinicId, {
      ipAddress:
        req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
        req.headers['x-real-ip']?.toString() ||
        req.ip,
      requestId: (req as any).requestId,
    });
  }

  @Post('forgot-password')
  @Public()
  @Throttle({ global: { ttl: 900000, limit: 5 } })
  @HttpCode(200)
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Req() req: TenantRequest & Request,
  ) {
    return this.authService.forgotPassword(
      dto,
      req.tenant!.clinicId,
      this.resolveFrontendUrl(req),
      {
        ipAddress:
          req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
          req.headers['x-real-ip']?.toString() ||
          req.ip,
        requestId: (req as any).requestId,
      },
    );
  }

  @Post('reset-password')
  @Public()
  @Throttle({ global: { ttl: 900000, limit: 10 } })
  @HttpCode(200)
  resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: TenantRequest & Request,
  ) {
    return this.authService.resetPassword(dto, req.tenant!.clinicId, {
      ipAddress:
        req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
        req.headers['x-real-ip']?.toString() ||
        req.ip,
      requestId: (req as any).requestId,
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  logout(@CurrentUser() user: { userId: string }) {
    return this.authService.logout(user.userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: { userId: string; email: string; role: string; clinicId: string }) {
    return this.authService.findById(user.userId);
  }

  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {}

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: TenantRequest, @Res() res: Response) {
    console.log('[auth][googleCallback] start', {
      clinicId: req.tenant?.clinicId,
      hasUser: Boolean(req.user),
    });

    const frontendUrl = 'http://localhost:5173';

    const { accessToken, refreshToken, user, flowToken, email, trustedDeviceToken } = req.user as {
      accessToken?: string;
      refreshToken?: string;
      user?: { role?: string };
      flowToken?: string;
      email?: string;
      trustedDeviceToken?: string;
    };

    console.log('[auth][googleCallback] redirecting to frontend', {
      frontendUrl,
      hasAccessToken: Boolean(accessToken),
      hasRefreshToken: Boolean(refreshToken),
      role: user?.role,
    });

    if (flowToken) {
      return res.redirect(
        `${frontendUrl}/auth/callback?requiresOtp=true&flowToken=${encodeURIComponent(flowToken)}&email=${encodeURIComponent(email || '')}`,
      );
    }

    this.applyTrustedDeviceCookie(res, trustedDeviceToken);

    return res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${encodeURIComponent(accessToken || '')}&refreshToken=${encodeURIComponent(refreshToken || '')}&role=${encodeURIComponent(user?.role || 'patient')}`,
    );
  }

  private resolveFrontendUrl(req: TenantRequest & Request) {
    const originHeader = req.headers.origin;
    const origin = Array.isArray(originHeader) ? originHeader[0] : originHeader;

    if (origin) {
      return origin;
    }

    return this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  }

  private getTrustedDeviceToken(req: Request) {
    const cookieHeader = req.headers.cookie;

    if (!cookieHeader) {
      return undefined;
    }

    const cookies = cookieHeader.split(';').map((part) => part.trim());
    const trustedCookie = cookies.find((cookie) =>
      cookie.startsWith(`${TRUSTED_DEVICE_COOKIE}=`),
    );

    if (!trustedCookie) {
      return undefined;
    }

    return decodeURIComponent(trustedCookie.split('=').slice(1).join('='));
  }

  private getUserAgent(req: Request) {
    const userAgent = req.headers['user-agent'];
    return Array.isArray(userAgent) ? userAgent[0] : userAgent;
  }

  private applyTrustedDeviceCookie(res: Response, token?: string) {
    if (!token) {
      return;
    }

    res.cookie(TRUSTED_DEVICE_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
}
