import { IsIn, IsString } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  @IsIn(['owner', 'admin', 'doctor', 'staff'])
  role!: string;
}
