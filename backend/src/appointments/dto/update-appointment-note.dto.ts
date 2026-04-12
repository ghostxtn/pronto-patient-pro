import { IsOptional, IsString } from 'class-validator';

export class UpdateAppointmentNoteDto {
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
}
