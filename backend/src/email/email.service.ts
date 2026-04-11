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

  private getFromAddress(): string {
    return (
      this.configService.get<string>('SMTP_FROM') ||
      this.configService.get<string>('SMTP_USER') ||
      'no-reply@localhost'
    );
  }

  async sendAuthOtp(email: string, code: string): Promise<void> {
    try {
      await this.getTransporter().sendMail({
        from: this.getFromAddress(),
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
    try {
      await this.getTransporter().sendMail({
        from: this.getFromAddress(),
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

  async sendAppointmentCreated(
    to: string,
    payload: {
      patientName: string;
      doctorName: string;
      date: string;
      startTime: string;
      endTime: string;
      type: string;
    },
  ): Promise<void> {
    try {
      await this.getTransporter().sendMail({
        from: this.getFromAddress(),
        to,
        subject: 'Randevunuz Oluşturuldu',
        html: `
          <p>Merhaba ${payload.patientName},</p>
          <p>Randevu talebiniz başarıyla oluşturuldu.</p>
          <p><strong>Doktor:</strong> ${payload.doctorName}</p>
          <p><strong>Tarih:</strong> ${payload.date}</p>
          <p><strong>Saat:</strong> ${payload.startTime} - ${payload.endTime}</p>
          <p><strong>Randevu Türü:</strong> ${payload.type}</p>
          <p>Randevunuz onaylandığında sizinle tekrar paylaşılacaktır.</p>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send appointment created email to ${to}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw new ServiceUnavailableException(
        'Email delivery failed. Check SMTP settings and use a verified SMTP_FROM sender address.',
      );
    }
  }

  async sendAppointmentConfirmed(
    to: string,
    payload: {
      patientName: string;
      doctorName: string;
      date: string;
      startTime: string;
      endTime: string;
    },
  ): Promise<void> {
    try {
      await this.getTransporter().sendMail({
        from: this.getFromAddress(),
        to,
        subject: 'Randevunuz Onaylandı',
        html: `
          <p>Merhaba ${payload.patientName},</p>
          <p>Randevunuz onaylandı.</p>
          <p><strong>Doktor:</strong> ${payload.doctorName}</p>
          <p><strong>Tarih:</strong> ${payload.date}</p>
          <p><strong>Saat:</strong> ${payload.startTime} - ${payload.endTime}</p>
          <p>Sağlıklı günler dileriz.</p>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send appointment confirmed email to ${to}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw new ServiceUnavailableException(
        'Email delivery failed. Check SMTP settings and use a verified SMTP_FROM sender address.',
      );
    }
  }

  async sendAppointmentCancelled(
    to: string,
    payload: {
      patientName: string;
      doctorName: string;
      date: string;
      startTime: string;
    },
  ): Promise<void> {
    try {
      await this.getTransporter().sendMail({
        from: this.getFromAddress(),
        to,
        subject: 'Randevunuz İptal Edildi',
        html: `
          <p>Merhaba ${payload.patientName},</p>
          <p>Aşağıdaki randevunuz iptal edilmiştir.</p>
          <p><strong>Doktor:</strong> ${payload.doctorName}</p>
          <p><strong>Tarih:</strong> ${payload.date}</p>
          <p><strong>Saat:</strong> ${payload.startTime}</p>
          <p>Detaylı bilgi için kliniğinizle iletişime geçebilirsiniz.</p>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send appointment cancelled email to ${to}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw new ServiceUnavailableException(
        'Email delivery failed. Check SMTP settings and use a verified SMTP_FROM sender address.',
      );
    }
  }

  async sendStaffNewAppointment(
    to: string,
    payload: {
      staffName: string;
      patientName: string;
      doctorName: string;
      date: string;
      startTime: string;
      endTime: string;
      type: string;
    },
  ): Promise<void> {
    try {
      await this.getTransporter().sendMail({
        from: this.getFromAddress(),
        to,
        subject: 'Yeni Randevu Talebi',
        html: `
          <p>Merhaba ${payload.staffName},</p>
          <p>Yeni bir randevu talebi oluşturuldu.</p>
          <p><strong>Hasta:</strong> ${payload.patientName}</p>
          <p><strong>Doktor:</strong> ${payload.doctorName}</p>
          <p><strong>Tarih:</strong> ${payload.date}</p>
          <p><strong>Saat:</strong> ${payload.startTime} - ${payload.endTime}</p>
          <p><strong>Randevu Türü:</strong> ${payload.type}</p>
          <p>Lutfen randevu talebini sistem uzerinden degerlendirin.</p>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send staff new appointment email to ${to}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );

      throw new ServiceUnavailableException(
        'Email delivery failed. Check SMTP settings and use a verified SMTP_FROM sender address.',
      );
    }
  }

  async sendDoctorAppointmentConfirmed(
    to: string,
    payload: {
      doctorName: string;
      patientName: string;
      date: string;
      startTime: string;
      endTime: string;
    },
  ): Promise<void> {
    try {
      await this.getTransporter().sendMail({
        from: this.getFromAddress(),
        to,
        subject: 'Randevu Onaylandı',
        html: `
          <p>Merhaba ${payload.doctorName},</p>
          <p>Randevunuz onaylandı.</p>
          <p><strong>Hasta:</strong> ${payload.patientName}</p>
          <p><strong>Tarih:</strong> ${payload.date}</p>
          <p><strong>Saat:</strong> ${payload.startTime} - ${payload.endTime}</p>
          <p>Takviminizi buna gore planlayabilirsiniz.</p>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send doctor appointment confirmed email to ${to}: ${
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
