import { IsBoolean } from 'class-validator';

export class AdminSetDoctorStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
