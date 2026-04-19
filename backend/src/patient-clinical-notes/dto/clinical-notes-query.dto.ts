import { IsUUID } from 'class-validator';

export class ClinicalNotesQueryDto {
  @IsUUID()
  patient_id: string;
}
