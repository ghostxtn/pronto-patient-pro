import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateAvailabilityOverrideDto {
  @IsOptional()
  @IsUUID()
  doctor_id?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @IsIn(['blackout', 'custom_hours'])
  type?: 'blackout' | 'custom_hours';

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'start_time must be HH:mm format',
  })
  start_time?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'end_time must be HH:mm format',
  })
  end_time?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
