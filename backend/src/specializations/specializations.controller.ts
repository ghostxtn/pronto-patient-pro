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
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantRequest } from '../common/interfaces/tenant-request.interface';
import { validateImageMagicBytes } from '../common/utils/magic-bytes.util';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { UpdateSpecializationDto } from './dto/update-specialization.dto';
import { SpecializationsService } from './specializations.service';

@Controller('specializations')
export class SpecializationsController {
  constructor(
    private readonly specializationsService: SpecializationsService,
  ) {}

  @Post()
  @Roles('owner', 'admin')
  create(
    @Body() dto: CreateSpecializationDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.specializationsService.create(dto, user.clinicId);
  }

  @Get('public-discovery')
  @Public()
  findPublicDiscovery(@Req() request: TenantRequest) {
    const clinicId = request.tenant?.clinicId;

    if (!clinicId) {
      throw new NotFoundException('Clinic not found');
    }

    return this.specializationsService.findPublicDiscoveryByClinic(clinicId);
  }

  @Get()
  findAll(@CurrentUser() user: { clinicId: string }) {
    return this.specializationsService.findAllByClinic(user.clinicId);
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: { clinicId: string }) {
    return this.specializationsService.findById(id, user.clinicId);
  }

  @Patch(':id')
  @Roles('owner', 'admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSpecializationDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.specializationsService.update(id, dto, user.clinicId);
  }

  @Patch(':id/image')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('owner', 'admin')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updateImage(
    @Param('id') id: string,
    @CurrentUser() user: { clinicId: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }

    if (!validateImageMagicBytes(file.buffer)) {
      throw new BadRequestException('Invalid image file');
    }

    await this.specializationsService.findById(id, user.clinicId);

    const extensionByMimeType: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };
    const extension = extensionByMimeType[file.mimetype];
    const uploadDir = join('/app/uploads', 'specializations', user.clinicId);
    mkdirSync(uploadDir, { recursive: true });

    const filename = `${id}.${extension}`;
    const diskPath = join(uploadDir, filename);
    writeFileSync(diskPath, file.buffer);

    const dbPath = `/uploads/specializations/${user.clinicId}/${filename}`;
    return this.specializationsService.updateImageUrl(id, user.clinicId, dbPath);
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  softDelete(
    @Param('id') id: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.specializationsService.softDelete(id, user.clinicId);
  }
}
