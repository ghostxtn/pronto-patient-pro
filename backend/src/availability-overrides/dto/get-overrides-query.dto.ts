import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class GetOverridesQueryDto {
  @IsOptional()
  @IsUUID()
  doctor_id?: string;

  @IsOptional()
  @IsDateString()
  date_from?: string;

  @IsOptional()
  @IsDateString()
  date_to?: string;
}
