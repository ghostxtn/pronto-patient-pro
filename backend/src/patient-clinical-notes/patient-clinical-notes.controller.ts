import {
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
import { TenantGuard } from '../common/guards/tenant.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateClinicalNoteDto } from './dto/create-clinical-note.dto';
import { UpdateClinicalNoteDto } from './dto/update-clinical-note.dto';
import { PatientClinicalNotesService } from './patient-clinical-notes.service';

@Controller('clinical-notes')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PatientClinicalNotesController {
  constructor(
    private readonly patientClinicalNotesService: PatientClinicalNotesService,
  ) {}

  @Get()
  listByPatient(
    @Query('patient_id') patientId: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.patientClinicalNotesService.listByPatient(
      patientId,
      user.clinicId,
    );
  }

  @Post()
  create(
    @Body() dto: CreateClinicalNoteDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.patientClinicalNotesService.create(dto, user.clinicId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClinicalNoteDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.patientClinicalNotesService.update(id, dto, user.clinicId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.patientClinicalNotesService.remove(id, user.clinicId);
  }
}
