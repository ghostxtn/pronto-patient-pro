import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateDoctorDto {
  @IsOptional()
  @IsUUID()
  specializationId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
