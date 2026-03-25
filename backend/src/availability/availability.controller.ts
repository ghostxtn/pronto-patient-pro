import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { GetSlotsDto } from './dto/get-slots.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Public()
  @UseGuards(TenantGuard)
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
  @Roles('owner', 'admin', 'doctor', 'staff')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAvailabilityDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.availabilityService.update(id, dto, user.clinicId);
  }

  @Delete(':id')
  @Roles('owner', 'admin', 'doctor', 'staff')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.availabilityService.remove(id, user.clinicId);
  }
}
