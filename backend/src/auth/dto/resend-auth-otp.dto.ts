import { IsString } from 'class-validator';

export class ResendAuthOtpDto {
  @IsString()
  flowToken!: string;
}
