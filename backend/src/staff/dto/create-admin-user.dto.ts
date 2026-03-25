import {
  IsEmail,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class DoctorProfileDto {
  @IsUUID()
  specializationId!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class CreateAdminUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(1)
  firstName!: string;

  @IsString()
  @MinLength(1)
  lastName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsIn(['owner', 'admin', 'doctor', 'staff'])
  role!: 'owner' | 'admin' | 'doctor' | 'staff';

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DoctorProfileDto)
  doctorProfile?: DoctorProfileDto;
}
