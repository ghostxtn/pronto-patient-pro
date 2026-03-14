import { IsEmail, IsNotEmpty, IsString, IsUUID, MinLength } from 'class-validator';

export class OnboardDoctorDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

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
