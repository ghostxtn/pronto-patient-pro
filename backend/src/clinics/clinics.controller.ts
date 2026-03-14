import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { ClinicsService } from './clinics.service';
import { CreateClinicDto } from './dto/create-clinic.dto';

@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post()
  @Roles('owner')
  create(@Body() dto: CreateClinicDto) {
    return this.clinicsService.create(dto);
  }

  @Get()
  @Roles('owner')
  findAll() {
    return this.clinicsService.findAll();
  }

  @Get(':id')
  @Roles('owner', 'admin')
  findById(@Param('id') id: string) {
    return this.clinicsService.findById(id);
  }

  @Patch(':id')
  @Roles('owner', 'admin')
  update(@Param('id') id: string, @Body() dto: Partial<CreateClinicDto>) {
    return this.clinicsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('owner')
  softDelete(@Param('id') id: string) {
    return this.clinicsService.softDelete(id);
  }
}
