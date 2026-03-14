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
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @Roles('owner', 'admin', 'doctor')
  create(
    @Body() dto: CreateAvailabilityDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.availabilityService.create(dto, user.clinicId);
  }

  @Get(':doctorId')
  findByDoctor(
    @Param('doctorId') doctorId: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.availabilityService.findByDoctor(doctorId, user.clinicId);
  }

  @Patch(':id')
  @Roles('owner', 'admin', 'doctor')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.availabilityService.update(id, dto, user.clinicId);
  }

  @Delete(':id')
  @Roles('owner', 'admin', 'doctor')
  softDelete(
    @Param('id') id: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.availabilityService.softDelete(id, user.clinicId);
  }
}
