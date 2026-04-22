import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { Audit } from '../common/decorators/audit.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TenantRequest } from '../common/interfaces/tenant-request.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminSetDoctorStatusDto } from './dto/admin-set-doctor-status.dto';
import { AdminUpdateDoctorDto } from './dto/admin-update-doctor.dto';
import { DoctorsQueryDto } from './dto/doctors-query.dto';
import { OnboardDoctorDto } from './dto/onboard-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { DoctorsService } from './doctors.service';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post('onboard')
  @Roles('owner', 'admin')
  onboardDoctor(
    @Body() dto: OnboardDoctorDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.doctorsService.onboardDoctor(dto, user.clinicId);
  }

  @Get('public-discovery')
  @Public()
  findPublicDiscovery(@Req() request: TenantRequest) {
    const clinicId = request.tenant?.clinicId;

    if (!clinicId) {
      throw new NotFoundException('Clinic not found');
    }

    return this.doctorsService.findPublicDiscoveryByClinic(clinicId);
  }

  @Get()
  @Roles('owner', 'admin', 'doctor', 'staff')
  findAll(
    @CurrentUser() user: { clinicId: string },
    @Query() query: DoctorsQueryDto,
  ) {
    return this.doctorsService.findAllByClinic(
      user.clinicId,
      query.specialization_id,
      query.status,
    );
  }

  @Get('me')
  @Roles('owner', 'doctor')
  findMyDoctorProfile(
    @CurrentUser() user: { userId: string; clinicId: string },
  ) {
    return this.doctorsService.findByUserId(user.userId, user.clinicId);
  }

  @Get(':id')
  @Roles('owner', 'admin', 'doctor', 'staff', 'patient')
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { clinicId: string; role: string },
  ) {
    return this.doctorsService.findById(id, user.clinicId, {
      includeInactive: user.role !== 'patient',
    });
  }

  @Audit('UPDATE_DOCTOR', 'doctor')
  @Patch(':id')
  @Roles('owner', 'admin')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDoctorDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.doctorsService.update(id, dto, user.clinicId);
  }

  @Patch(':id/admin')
  @Roles('admin')
  adminUpdateDoctor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateDoctorDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.doctorsService.adminUpdateDoctor(id, dto, user.clinicId);
  }

  @Audit('UPDATE_DOCTOR_STATUS', 'doctor')
  @Patch(':id/status')
  @Roles('admin')
  adminSetDoctorStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminSetDoctorStatusDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.doctorsService.adminSetDoctorStatus(id, dto, user.clinicId);
  }

  @Audit('DELETE_DOCTOR', 'doctor')
  @Delete(':id')
  @Roles('owner', 'admin')
  softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.doctorsService.softDelete(id, user.clinicId);
  }
}
