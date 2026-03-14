import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { TenantRequest } from '../common/interfaces/tenant-request.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(201)
  register(@Body() dto: RegisterDto, @Req() req: TenantRequest) {
    return this.authService.register(dto, req.tenant!.clinicId);
  }

  @Post('login')
  @Public()
  @HttpCode(200)
  login(@Body() dto: LoginDto, @Req() req: TenantRequest) {
    return this.authService.login(dto, req.tenant!.clinicId);
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
  googleCallback(@Req() req: TenantRequest) {
    return req.user;
  }
}
