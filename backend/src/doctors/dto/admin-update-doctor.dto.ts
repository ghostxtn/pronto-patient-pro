import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AdminUpdateDoctorDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsUUID()
  @IsNotEmpty()
  specializationId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  bio!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;
}
