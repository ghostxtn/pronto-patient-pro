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
import { Audit } from '../common/decorators/audit.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantGuard } from '../common/guards/tenant.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClinicalNotesQueryDto } from './dto/clinical-notes-query.dto';
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
  @Audit('LIST_CLINICAL_NOTES', 'clinical_note')
  @Roles('owner', 'doctor')
  listByPatient(
    @Query() query: ClinicalNotesQueryDto,
    @CurrentUser() user: { clinicId: string; role: string },
  ) {
    return this.patientClinicalNotesService.listByPatient(
      query.patient_id,
      user.clinicId,
      user.role,
    );
  }

  @Post()
  @Audit('CREATE_CLINICAL_NOTE', 'clinical_note')
  @Roles('owner', 'doctor')
  create(
    @Body() dto: CreateClinicalNoteDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.patientClinicalNotesService.create(dto, user.clinicId);
  }

  @Patch(':id')
  @Audit('UPDATE_CLINICAL_NOTE', 'clinical_note')
  @Roles('owner', 'doctor')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClinicalNoteDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.patientClinicalNotesService.update(id, dto, user.clinicId);
  }

  @Delete(':id')
  @Audit('DELETE_CLINICAL_NOTE', 'clinical_note')
  @Roles('owner', 'doctor')
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.patientClinicalNotesService.remove(id, user.clinicId);
  }
}
