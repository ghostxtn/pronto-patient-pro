import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter?: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {}

  async sendAuthOtp(email: string, code: string): Promise<void> {
    const from =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      'no-reply@localhost';

    try {
      await this.getTransporter().sendMail({
        from,
        to: email,
        subject: 'Your verification code',
        text: `Your verification code is ${code}. It expires in 10 minutes.`,
        html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send OTP email to ${email}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw new ServiceUnavailableException(
        'Email delivery failed. Check SMTP settings and use a verified SMTP_FROM sender address.',
      );
    }
  }

  async sendPasswordReset(
    email: string,
    resetLink: string,
    expiresInMinutes: number,
  ): Promise<void> {
    const from =
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      'no-reply@localhost';

    try {
      await this.getTransporter().sendMail({
        from,
        to: email,
        subject: 'Reset your password',
        text: [
          'We received a request to reset your password.',
          `Use this link to set a new password: ${resetLink}`,
          `This link expires in ${expiresInMinutes} minutes.`,
          'If you did not request this, you can ignore this email.',
        ].join('\n\n'),
        html: `
          <p>We received a request to reset your password.</p>
          <p><a href="${resetLink}">Set a new password</a></p>
          <p>This link expires in ${expiresInMinutes} minutes.</p>
          <p>If you did not request this, you can ignore this email.</p>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw new ServiceUnavailableException(
        'Email delivery failed. Check SMTP settings and use a verified SMTP_FROM sender address.',
      );
    }
  }

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT', '587'));
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = this.configService.get<string>('SMTP_FROM');
    const secure = this.configService.get<string>('SMTP_SECURE', 'false') === 'true';

    if (!host || !user || !pass) {
      throw new ServiceUnavailableException(
        'Email delivery is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.',
      );
    }

    if (!from || from.includes('your-verified-domain.com')) {
      throw new ServiceUnavailableException(
        'Email delivery is not configured correctly. Set SMTP_FROM to a verified sender address.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    return this.transporter;
  }
}
