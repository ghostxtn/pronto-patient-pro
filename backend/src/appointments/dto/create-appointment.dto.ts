import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  doctorId!: string;

  @IsUUID()
  patientId!: string;

  @IsString()
  appointmentDate!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must be HH:mm format',
  })
  startTime!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime must be HH:mm format',
  })
  endTime!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
