import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateDoctorDto {
  @IsOptional()
  @IsUUID()
  specializationId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
