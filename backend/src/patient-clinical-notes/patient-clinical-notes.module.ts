import { Module } from '@nestjs/common';
import { PatientClinicalNotesController } from './patient-clinical-notes.controller';
import { PatientClinicalNotesService } from './patient-clinical-notes.service';

@Module({
  controllers: [PatientClinicalNotesController],
  providers: [PatientClinicalNotesService],
  exports: [PatientClinicalNotesService],
})
export class PatientClinicalNotesModule {}
