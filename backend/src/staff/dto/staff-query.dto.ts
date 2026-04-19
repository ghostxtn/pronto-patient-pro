import { IsIn, IsOptional, IsString } from 'class-validator';

export class StaffQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['owner', 'admin', 'doctor', 'staff', 'patient'])
  role?: string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended'])
  status?: string;
}
