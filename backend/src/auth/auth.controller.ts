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
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
  register(@Body() dto: RegisterDto, @Req() req: TenantRequest & Request) {
    return this.authService.register(dto, req.tenant!.clinicId, {
      ipAddress:
        req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
        req.headers['x-real-ip']?.toString() ||
        req.ip,
      requestId: (req as any).requestId,
    });
  }

  @Post('login')
  @Public()
  @Throttle({ global: { ttl: 900000, limit: 5 } })
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() req: TenantRequest & Request) {
    return this.authService.login(dto, req.tenant!.clinicId, {
      ipAddress:
        req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
        req.headers['x-real-ip']?.toString() ||
        req.ip,
      requestId: (req as any).requestId,
    });
  }

  @Post('refresh')
  @Public()
  @HttpCode(200)
  refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
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

    const { accessToken, refreshToken, user } = req.user as {
      accessToken: string;
      refreshToken: string;
      user: { role?: string };
    };

    console.log('[auth][googleCallback] redirecting to frontend', {
      frontendUrl,
      hasAccessToken: Boolean(accessToken),
      hasRefreshToken: Boolean(refreshToken),
      role: user?.role,
    });

    return res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}&role=${encodeURIComponent(user?.role || 'patient')}`,
    );
  }
}
