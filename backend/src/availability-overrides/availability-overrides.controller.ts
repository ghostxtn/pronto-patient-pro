import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AvailabilityOverridesService } from './availability-overrides.service';
import { CreateAvailabilityOverrideDto } from './dto/create-availability-override.dto';
import { UpdateAvailabilityOverrideDto } from './dto/update-availability-override.dto';

@Controller('availability-overrides')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AvailabilityOverridesController {
  constructor(
    private readonly availabilityOverridesService: AvailabilityOverridesService,
  ) {}

  @Get()
  @Roles('owner', 'admin', 'doctor', 'staff')
  findAll(
    @CurrentUser() user: { clinicId: string },
    @Query('doctor_id') doctorId?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
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
  create(
    @Body() dto: CreateAvailabilityOverrideDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.availabilityOverridesService.create(dto, user.clinicId);
  }

  @Patch(':id')
  @Roles('owner', 'admin', 'doctor', 'staff')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityOverrideDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.availabilityOverridesService.update(id, dto, user.clinicId);
  }

  @Delete(':id')
  @Roles('owner', 'admin', 'doctor', 'staff')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.availabilityOverridesService.remove(id, user.clinicId);
  }
}
