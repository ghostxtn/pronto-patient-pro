import {
  BadRequestException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { and, eq } from 'drizzle-orm';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { users } from '../database/schema';
import {
  appointmentFileMulterOptions,
  avatarMulterOptions,
} from './multer.config';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(
    private readonly storageService: StorageService,
    @Inject('DRIZZLE') private readonly db: any,
  ) {}

  @Post('avatar')
  @Audit('UPLOAD_AVATAR', 'file')
  @UseInterceptors(FileInterceptor('file', avatarMulterOptions))
  async uploadAvatar(
    @CurrentUser() user: { userId: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.storageService.saveAvatar(user.userId, file);
  }

  @Post('avatar/:userId')
  @Audit('UPLOAD_AVATAR', 'file')
  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
  @Roles('owner', 'admin')
  @UseInterceptors(FileInterceptor('avatar', avatarMulterOptions))
  async uploadAvatarForUser(
    @Param('userId') userId: string,
    @CurrentUser() user: { clinicId: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const [targetUser] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.clinic_id, user.clinicId)))
      .limit(1);

    if (!targetUser) {
      throw new ForbiddenException('User not in your clinic');
    }

    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.storageService.saveAvatar(userId, file);
  }

  @Post('appointments/:appointmentId/files')
  @Audit('UPLOAD_FILE', 'file')
  @Roles('owner', 'admin', 'doctor')
  @UseInterceptors(FileInterceptor('file', appointmentFileMulterOptions))
  async uploadAppointmentFile(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: { clinicId: string; userId: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.storageService.saveAppointmentFile(
      appointmentId,
      user.clinicId,
      user.userId,
      file,
    );
  }

  @Get('appointments/:appointmentId/files')
  @Roles('owner', 'admin', 'doctor')
  getAppointmentFiles(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.storageService.getFilesByAppointment(
      appointmentId,
      user.clinicId,
    );
  }

  @Get('files/:fileId/download')
  @Audit('DOWNLOAD_FILE', 'file')
  async downloadFile(
    @Param('fileId') fileId: string,
    @CurrentUser() user: { clinicId: string },
    @Res() response: Response,
  ) {
    const file = await this.storageService.getFileById(fileId, user.clinicId);
    return response.download(file.file_path, file.file_name);
  }

  @Delete('files/:fileId')
  @Audit('DELETE_FILE', 'file')
  @Roles('owner', 'admin', 'doctor')
  deleteFile(
    @Param('fileId') fileId: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.storageService.deleteFile(fileId, user.clinicId);
  }
}
