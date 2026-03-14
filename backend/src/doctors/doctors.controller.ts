import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminSetDoctorStatusDto } from './dto/admin-set-doctor-status.dto';
import { AdminUpdateDoctorDto } from './dto/admin-update-doctor.dto';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { OnboardDoctorDto } from './dto/onboard-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Roles('owner', 'admin')
  create(
    @Body() dto: CreateDoctorDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.doctorsService.create(dto, user.clinicId);
  }

  @Post('onboard')
  @Roles('admin')
  onboardDoctor(
    @Body() dto: OnboardDoctorDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.doctorsService.onboardDoctor(dto, user.clinicId);
  }

  @Get()
  findAll(@CurrentUser() user: { clinicId: string }) {
    return this.doctorsService.findAllByClinic(user.clinicId);
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: { clinicId: string }) {
    return this.doctorsService.findById(id, user.clinicId);
  }

  @Patch(':id')
  @Roles('owner', 'admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDoctorDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.doctorsService.update(id, dto, user.clinicId);
  }

  @Patch(':id/admin')
  @Roles('admin')
  adminUpdateDoctor(
    @Param('id') id: string,
    @Body() dto: AdminUpdateDoctorDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.doctorsService.adminUpdateDoctor(id, dto, user.clinicId);
  }

  @Patch(':id/status')
  @Roles('admin')
  adminSetDoctorStatus(
    @Param('id') id: string,
    @Body() dto: AdminSetDoctorStatusDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.doctorsService.adminSetDoctorStatus(id, dto, user.clinicId);
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  softDelete(
    @Param('id') id: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.doctorsService.softDelete(id, user.clinicId);
  }
}
