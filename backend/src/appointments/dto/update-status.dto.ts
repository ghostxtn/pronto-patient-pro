import { IsIn, IsString } from 'class-validator';

export class UpdateStatusDto {
  @IsString()
  @IsIn([
    'pending',
    'scheduled',
    'approved',
    'confirmed',
    'declined',
    'rejected',
    'completed',
    'cancelled',
    'no_show',
  ])
  status!: string;
}
