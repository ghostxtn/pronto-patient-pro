import {
  IsDefined,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreateClinicalNoteDto {
  @IsUUID()
  patient_id!: string;

  @IsUUID()
  doctor_id!: string;

  @IsOptional()
  @IsUUID()
  appointment_id?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  treatment?: string;

  @IsOptional()
  @IsString()
  prescription?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @ValidateIf(
    (value: CreateClinicalNoteDto) =>
      ![
        value.diagnosis,
        value.treatment,
        value.prescription,
        value.notes,
      ].some((field) => typeof field === 'string' && field.trim().length > 0),
  )
  @IsDefined({
    message:
      'At least one of diagnosis, treatment, prescription, or notes must be provided',
  })
  private readonly content_required?: string;
}
