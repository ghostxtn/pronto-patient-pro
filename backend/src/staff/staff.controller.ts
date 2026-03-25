import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { SetStaffStatusDto } from './dto/set-staff-status.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffService } from './staff.service';

@Controller('users')
@Roles('owner', 'admin')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  findAll(
    @CurrentUser() user: { clinicId: string },
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    if (role && role !== 'staff') {
      return [];
    }

    return this.staffService.findAllByClinic(user.clinicId, { search, status });
  }

  @Post()
  createUser(
    @Body() dto: CreateAdminUserDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.staffService.createUser(dto, user.clinicId);
  }

  @Post('staff')
  create(@Body() dto: CreateAdminUserDto, @CurrentUser() user: { clinicId: string }) {
    return this.staffService.create(dto, user.clinicId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.staffService.update(id, dto, user.clinicId);
  }

  @Patch(':id/status')
  setStatus(
    @Param('id') id: string,
    @Body() dto: SetStaffStatusDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.staffService.setStatus(id, dto, user.clinicId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { clinicId: string }) {
    return this.staffService.remove(id, user.clinicId);
  }
}
