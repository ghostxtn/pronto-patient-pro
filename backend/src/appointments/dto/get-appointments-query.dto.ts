import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';

export class GetAppointmentsQueryDto {
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsIn(['pending', 'approved', 'cancelled', 'completed'])
  status?: string;
}
