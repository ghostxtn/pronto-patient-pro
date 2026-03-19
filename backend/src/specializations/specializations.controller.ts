import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantRequest } from '../common/interfaces/tenant-request.interface';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { UpdateSpecializationDto } from './dto/update-specialization.dto';
import { SpecializationsService } from './specializations.service';

@Controller('specializations')
export class SpecializationsController {
  constructor(
    private readonly specializationsService: SpecializationsService,
  ) {}

  @Post()
  @Roles('owner', 'admin')
  create(
    @Body() dto: CreateSpecializationDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.specializationsService.create(dto, user.clinicId);
  }

  @Get('public-discovery')
  @Public()
  findPublicDiscovery(@Req() request: TenantRequest) {
    const clinicId = request.tenant?.clinicId;

    if (!clinicId) {
      throw new NotFoundException('Clinic not found');
    }

    return this.specializationsService.findPublicDiscoveryByClinic(clinicId);
  }

  @Get()
  findAll(@CurrentUser() user: { clinicId: string }) {
    return this.specializationsService.findAllByClinic(user.clinicId);
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: { clinicId: string }) {
    return this.specializationsService.findById(id, user.clinicId);
  }

  @Patch(':id')
  @Roles('owner', 'admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSpecializationDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.specializationsService.update(id, dto, user.clinicId);
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  softDelete(
    @Param('id') id: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.specializationsService.softDelete(id, user.clinicId);
  }
}
