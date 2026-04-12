import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Audit } from '../common/decorators/audit.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantRequest } from '../common/interfaces/tenant-request.interface';
import { validateImageMagicBytes } from '../common/utils/magic-bytes.util';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post()
  @Roles('owner')
  create(@Body() dto: CreateClinicDto) {
    return this.clinicsService.create(dto);
  }

  @Get()
  @Roles('owner')
  findAll() {
    return this.clinicsService.findAll();
  }

  @Get('current')
  @Public()
  findCurrent(@Req() request: TenantRequest) {
    const clinicId = request.tenant?.clinicId;

    if (!clinicId) {
      throw new NotFoundException('Clinic not found');
    }

    return this.clinicsService.findById(clinicId);
  }

  @Get(':id')
  @Roles('owner', 'admin')
  findById(@Param('id') id: string) {
    return this.clinicsService.findById(id);
  }

  @Audit('UPDATE_CLINIC', 'clinic')
  @Patch(':id')
  @Roles('owner', 'admin')
  update(@Param('id') id: string, @Body() dto: UpdateClinicDto) {
    return this.clinicsService.update(id, dto);
  }

  @Audit('UPDATE_CLINIC_LOGO', 'clinic')
  @Patch(':id/logo')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('owner')
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updateLogo(
    @Param('id') id: string,
    @CurrentUser() user: { clinicId: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Logo file is required');
    }

    const clinic = await this.clinicsService.findById(id);
    if (clinic.id !== user.clinicId) {
      throw new NotFoundException('Clinic not found');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }

    if (!validateImageMagicBytes(file.buffer)) {
      throw new BadRequestException('Invalid image file');
    }

    const extensionByMimeType: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const extension = extensionByMimeType[file.mimetype];
    const uploadDir = join('/app/uploads', 'clinics', user.clinicId);
    mkdirSync(uploadDir, { recursive: true });

    const filename = `logo.${extension}`;
    const diskPath = join(uploadDir, filename);
    writeFileSync(diskPath, file.buffer);

    const dbPath = `/uploads/clinics/${user.clinicId}/${filename}`;
    return this.clinicsService.updateLogoUrl(id, dbPath);
  }

  @Delete(':id')
  @Roles('owner')
  softDelete(@Param('id') id: string) {
    return this.clinicsService.softDelete(id);
  }
}
