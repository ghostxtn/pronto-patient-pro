import { IsIn, IsString } from 'class-validator';

export class UpdateStatusDto {
  @IsString()
  @IsIn(['pending', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])
  status!: string;
}
