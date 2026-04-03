import { IsString, Length } from 'class-validator';

export class VerifyAuthOtpDto {
  @IsString()
  flowToken!: string;

  @IsString()
  @Length(6, 6)
  code!: string;
}
