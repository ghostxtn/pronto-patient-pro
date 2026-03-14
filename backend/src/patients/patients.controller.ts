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
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles('owner', 'admin', 'doctor', 'staff')
  create(
    @Body() dto: CreatePatientDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.patientsService.create(dto, user.clinicId);
  }

  @Get()
  findAll(@CurrentUser() user: { clinicId: string }) {
    return this.patientsService.findAllByClinic(user.clinicId);
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: { clinicId: string }) {
    return this.patientsService.findById(id, user.clinicId);
  }

  @Patch(':id')
  @Roles('owner', 'admin', 'doctor', 'staff')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.patientsService.update(id, dto, user.clinicId);
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  softDelete(
    @Param('id') id: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.patientsService.softDelete(id, user.clinicId);
  }
}
