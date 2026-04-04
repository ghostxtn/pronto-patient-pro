import { IsIn, IsString } from 'class-validator';

export class UpdateStatusDto {
  @IsString()
  // Keep 'scheduled' as a legacy alias on input only; the service normalizes it to 'confirmed'.
  @IsIn(['pending', 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'])
  status!: string;
}
