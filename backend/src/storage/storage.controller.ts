import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  appointmentFileMulterOptions,
  avatarMulterOptions,
} from './multer.config';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('avatar')
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

  @Post('appointments/:appointmentId/files')
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
  async downloadFile(
    @Param('fileId') fileId: string,
    @CurrentUser() user: { clinicId: string },
    @Res() response: Response,
  ) {
    const file = await this.storageService.getFileById(fileId, user.clinicId);
    return response.download(file.file_path, file.file_name);
  }

  @Delete('files/:fileId')
  @Roles('owner', 'admin', 'doctor')
  deleteFile(
    @Param('fileId') fileId: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.storageService.deleteFile(fileId, user.clinicId);
  }
}
