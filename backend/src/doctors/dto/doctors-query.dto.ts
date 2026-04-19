import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class DoctorsQueryDto {
  @IsOptional()
  @IsUUID()
  specialization_id?: string;

  @IsOptional()
  @IsIn(['active', 'inactive', 'on_leave'])
  status?: string;
}
