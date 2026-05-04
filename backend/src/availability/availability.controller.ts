import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantRequest } from '../common/interfaces/tenant-request.interface';
import { DoctorsService } from '../doctors/doctors.service';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { GetSlotsDto } from './dto/get-slots.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('availability')
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly doctorsService: DoctorsService,
  ) {}

  @Public()
  @UseGuards(TenantGuard)
  @Throttle({ global: { limit: 30, ttl: 60000 } })
  @Get('slots')
  getSlots(@Query() query: GetSlotsDto, @Req() req: TenantRequest) {
    return this.availabilityService.getBookableSlots(
      req.tenant!.clinicId,
      query.doctor_id,
      query.date,
    );
  }

  @Post()
  @Roles('owner', 'admin', 'doctor', 'staff')
  async create(
    @Body() dto: CreateAvailabilityDto,
    @CurrentUser() user: { clinicId: string; role: string; userId: string },
  ) {
    dto.doctorId = await this.resolveDoctorId(user, dto.doctorId);
    return this.availabilityService.create(dto, user.clinicId);
  }

  @Get(':doctorId')
  @Roles('owner', 'admin', 'doctor', 'staff', 'patient')
  findByDoctor(
    @Param('doctorId', ParseUUIDPipe) doctorId: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.availabilityService.findByDoctor(doctorId, user.clinicId);
  }

  @Patch(':id')
  @Roles('owner', 'admin', 'doctor', 'staff')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAvailabilityDto,
    @CurrentUser() user: { clinicId: string; role: string; userId: string },
  ) {
    await this.assertDoctorOwnsAvailability(user, id);
    return this.availabilityService.update(id, dto, user.clinicId);
  }

  @Delete(':id')
  @Roles('owner', 'admin', 'doctor', 'staff')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { clinicId: string; role: string; userId: string },
  ) {
    await this.assertDoctorOwnsAvailability(user, id);
    return this.availabilityService.remove(id, user.clinicId);
  }

  private async resolveDoctorId(
    user: { clinicId: string; role: string; userId: string },
    clientSuppliedDoctorId: string,
  ): Promise<string> {
    if (user.role !== 'doctor') {
      return clientSuppliedDoctorId;
    }

    const doctor = await this.doctorsService.findByUserId(
      user.userId,
      user.clinicId,
    );
    if (!doctor) {
      throw new ForbiddenException('Doctor profile not found');
    }

    return doctor.id;
  }

  private async assertDoctorOwnsAvailability(
    user: { clinicId: string; role: string; userId: string },
    availabilityId: string,
  ): Promise<void> {
    if (user.role !== 'doctor') {
      return;
    }

    const doctorId = await this.resolveDoctorId(user, '');
    const availability = await this.availabilityService.findById(
      availabilityId,
      user.clinicId,
    );

    if (availability.doctor_id !== doctorId) {
      throw new ForbiddenException(
        'Doctors can only modify their own availability',
      );
    }
  }
}
