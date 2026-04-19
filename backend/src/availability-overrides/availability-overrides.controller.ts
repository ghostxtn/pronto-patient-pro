import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { doctorAvailabilityOverrides } from '../database/schema';
import { DoctorsService } from '../doctors/doctors.service';
import { AvailabilityOverridesService } from './availability-overrides.service';
import { CreateAvailabilityOverrideDto } from './dto/create-availability-override.dto';
import { GetOverridesQueryDto } from './dto/get-overrides-query.dto';
import { UpdateAvailabilityOverrideDto } from './dto/update-availability-override.dto';

@Controller('availability-overrides')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AvailabilityOverridesController {
  constructor(
    private readonly availabilityOverridesService: AvailabilityOverridesService,
    private readonly doctorsService: DoctorsService,
    @Inject('DRIZZLE') private readonly db: any,
  ) {}

  @Get()
  @Roles('owner', 'admin', 'doctor', 'staff')
  findAll(
    @CurrentUser() user: { clinicId: string },
    @Query() query: GetOverridesQueryDto,
  ) {
    const { doctor_id: doctorId, date_from: dateFrom, date_to: dateTo } = query;
    if (!doctorId) {
      throw new BadRequestException('doctor_id is required');
    }

    if ((dateFrom && !dateTo) || (!dateFrom && dateTo)) {
      throw new BadRequestException(
        'date_from and date_to must be provided together',
      );
    }

    if (dateFrom && dateTo) {
      return this.availabilityOverridesService.listByDateRange(
        doctorId,
        user.clinicId,
        dateFrom,
        dateTo,
      );
    }

    return this.availabilityOverridesService.listByDoctor(
      doctorId,
      user.clinicId,
    );
  }

  @Post()
  @Roles('owner', 'admin', 'doctor', 'staff')
  async create(
    @Body() dto: CreateAvailabilityOverrideDto,
    @CurrentUser() user: { clinicId: string; role: string; userId: string },
  ) {
    dto.doctor_id = await this.resolveDoctorId(user, dto.doctor_id);
    return this.availabilityOverridesService.create(dto, user.clinicId);
  }

  @Patch(':id')
  @Roles('owner', 'admin', 'doctor', 'staff')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityOverrideDto,
    @CurrentUser() user: { clinicId: string; role: string; userId: string },
  ) {
    await this.assertDoctorOwnsOverride(user, id);
    if (dto.doctor_id !== undefined) {
      dto.doctor_id = await this.resolveDoctorId(user, dto.doctor_id);
    }
    return this.availabilityOverridesService.update(id, dto, user.clinicId);
  }

  @Delete(':id')
  @Roles('owner', 'admin', 'doctor', 'staff')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { clinicId: string; role: string; userId: string },
  ) {
    await this.assertDoctorOwnsOverride(user, id);
    return this.availabilityOverridesService.remove(id, user.clinicId);
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

  private async assertDoctorOwnsOverride(
    user: { clinicId: string; role: string; userId: string },
    overrideId: string,
  ): Promise<void> {
    if (user.role !== 'doctor') {
      return;
    }

    const doctorId = await this.resolveDoctorId(user, '');
    const [override] = await this.db
      .select({ doctor_id: doctorAvailabilityOverrides.doctor_id })
      .from(doctorAvailabilityOverrides)
      .where(
        and(
          eq(doctorAvailabilityOverrides.id, overrideId),
          eq(doctorAvailabilityOverrides.clinic_id, user.clinicId),
        ),
      )
      .limit(1);

    if (!override || override.doctor_id !== doctorId) {
      throw new ForbiddenException(
        'Doctors can only modify their own availability overrides',
      );
    }
  }
}
