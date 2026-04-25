import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type ClinicEmailContext = {
  clinicId: string;
  clinicName: string;
  clinicDomain: string;
  clinicEmail: string | null;
};

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
    await this.sendEmail({
      to: email,
      subject: 'Your verification code',
      text: `Your verification code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
      logContext: 'OTP',
    });
  }

  async sendPasswordReset(
    email: string,
    resetLink: string,
    expiresInMinutes: number,
  ): Promise<void> {
    await this.sendEmail({
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
      logContext: 'password reset',
    });
  }

  async sendAppointmentCreated(
    to: string,
    payload: {
      clinic?: ClinicEmailContext;
      patientName: string;
      doctorName: string;
      date: string;
      startTime: string;
      endTime: string;
      type: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to,
      clinic: payload.clinic,
      subject: 'Your appointment request has been received',
      text: [
        `Hello ${payload.patientName},`,
        'Your appointment request has been received.',
        `Doctor: ${payload.doctorName}`,
        `Date: ${payload.date}`,
        `Time: ${payload.startTime} - ${payload.endTime}`,
        `Appointment type: ${payload.type || 'General appointment'}`,
        'We will notify you once the request is reviewed.',
      ].join('\n'),
      html: `
        <p>Hello ${payload.patientName},</p>
        <p>Your appointment request has been received.</p>
        <p><strong>Doctor:</strong> ${payload.doctorName}</p>
        <p><strong>Date:</strong> ${payload.date}</p>
        <p><strong>Time:</strong> ${payload.startTime} - ${payload.endTime}</p>
        <p><strong>Appointment type:</strong> ${payload.type || 'General appointment'}</p>
        <p>We will notify you once the request is reviewed.</p>
      `,
      logContext: 'appointment created',
    });
  }

  async sendAppointmentConfirmed(
    to: string,
    payload: {
      clinic?: ClinicEmailContext;
      patientName: string;
      doctorName: string;
      date: string;
      startTime: string;
      endTime: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to,
      clinic: payload.clinic,
      subject: 'Your appointment has been confirmed',
      text: [
        `Hello ${payload.patientName},`,
        'Your appointment has been confirmed.',
        `Doctor: ${payload.doctorName}`,
        `Date: ${payload.date}`,
        `Time: ${payload.startTime} - ${payload.endTime}`,
      ].join('\n'),
      html: `
        <p>Hello ${payload.patientName},</p>
        <p>Your appointment has been confirmed.</p>
        <p><strong>Doctor:</strong> ${payload.doctorName}</p>
        <p><strong>Date:</strong> ${payload.date}</p>
        <p><strong>Time:</strong> ${payload.startTime} - ${payload.endTime}</p>
      `,
      logContext: 'appointment confirmed',
    });
  }

  async sendAppointmentDeclined(
    to: string,
    payload: {
      clinic?: ClinicEmailContext;
      patientName: string;
      doctorName: string;
      date: string;
      startTime: string;
      endTime: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to,
      clinic: payload.clinic,
      subject: 'Your appointment request was declined',
      text: [
        `Hello ${payload.patientName},`,
        'Your appointment request was declined.',
        `Doctor: ${payload.doctorName}`,
        `Date: ${payload.date}`,
        `Time: ${payload.startTime} - ${payload.endTime}`,
        'Please contact the clinic if you want to request another time.',
      ].join('\n'),
      html: `
        <p>Hello ${payload.patientName},</p>
        <p>Your appointment request was declined.</p>
        <p><strong>Doctor:</strong> ${payload.doctorName}</p>
        <p><strong>Date:</strong> ${payload.date}</p>
        <p><strong>Time:</strong> ${payload.startTime} - ${payload.endTime}</p>
        <p>Please contact the clinic if you want to request another time.</p>
      `,
      logContext: 'appointment declined',
    });
  }

  async sendAppointmentReminder(
    to: string,
    payload: {
      clinic?: ClinicEmailContext;
      patientName: string;
      doctorName: string;
      date: string;
      startTime: string;
      endTime: string;
      type: string;
      reminderLeadHours: number;
    },
  ): Promise<void> {
    await this.sendEmail({
      to,
      clinic: payload.clinic,
      subject: 'Appointment reminder',
      text: [
        `Hello ${payload.patientName},`,
        `This is a reminder that you have an appointment in about ${payload.reminderLeadHours} hours.`,
        `Doctor: ${payload.doctorName}`,
        `Date: ${payload.date}`,
        `Time: ${payload.startTime} - ${payload.endTime}`,
        `Appointment type: ${payload.type || 'General appointment'}`,
      ].join('\n'),
      html: `
        <p>Hello ${payload.patientName},</p>
        <p>This is a reminder that you have an appointment in about ${payload.reminderLeadHours} hours.</p>
        <p><strong>Doctor:</strong> ${payload.doctorName}</p>
        <p><strong>Date:</strong> ${payload.date}</p>
        <p><strong>Time:</strong> ${payload.startTime} - ${payload.endTime}</p>
        <p><strong>Appointment type:</strong> ${payload.type || 'General appointment'}</p>
      `,
      logContext: 'appointment reminder',
    });
  }

  async sendAppointmentCancelled(
    to: string,
    payload: {
      clinic?: ClinicEmailContext;
      patientName: string;
      doctorName: string;
      date: string;
      startTime: string;
      endTime: string;
      cancelledBy: string;
    },
  ): Promise<void> {
    const cancellationLine =
      payload.cancelledBy === 'patient'
        ? 'You cancelled this appointment.'
        : payload.cancelledBy === 'clinic'
          ? 'The clinic cancelled this appointment.'
          : 'This appointment was cancelled.';

    await this.sendEmail({
      to,
      clinic: payload.clinic,
      subject: 'Your appointment was cancelled',
      text: [
        `Hello ${payload.patientName},`,
        cancellationLine,
        `Doctor: ${payload.doctorName}`,
        `Date: ${payload.date}`,
        `Time: ${payload.startTime} - ${payload.endTime}`,
      ].join('\n'),
      html: `
        <p>Hello ${payload.patientName},</p>
        <p>${cancellationLine}</p>
        <p><strong>Doctor:</strong> ${payload.doctorName}</p>
        <p><strong>Date:</strong> ${payload.date}</p>
        <p><strong>Time:</strong> ${payload.startTime} - ${payload.endTime}</p>
      `,
      logContext: 'appointment cancelled',
    });
  }

  async sendStaffNewAppointment(
    to: string,
    payload: {
      clinic?: ClinicEmailContext;
      staffName: string;
      patientName: string;
      doctorName: string;
      date: string;
      startTime: string;
      endTime: string;
      type: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to,
      clinic: payload.clinic,
      subject: 'New appointment request',
      text: [
        `Hello ${payload.staffName},`,
        'A new appointment request was created.',
        `Patient: ${payload.patientName}`,
        `Doctor: ${payload.doctorName}`,
        `Date: ${payload.date}`,
        `Time: ${payload.startTime} - ${payload.endTime}`,
        `Appointment type: ${payload.type || 'General appointment'}`,
      ].join('\n'),
      html: `
        <p>Hello ${payload.staffName},</p>
        <p>A new appointment request was created.</p>
        <p><strong>Patient:</strong> ${payload.patientName}</p>
        <p><strong>Doctor:</strong> ${payload.doctorName}</p>
        <p><strong>Date:</strong> ${payload.date}</p>
        <p><strong>Time:</strong> ${payload.startTime} - ${payload.endTime}</p>
        <p><strong>Appointment type:</strong> ${payload.type || 'General appointment'}</p>
      `,
      logContext: 'staff new appointment',
    });
  }

  async sendStaffAppointmentCancelled(
    to: string,
    payload: {
      clinic?: ClinicEmailContext;
      staffName: string;
      patientName: string;
      doctorName: string;
      date: string;
      startTime: string;
      endTime: string;
      cancelledBy: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to,
      clinic: payload.clinic,
      subject: 'Appointment cancelled',
      text: [
        `Hello ${payload.staffName},`,
        `An appointment was cancelled by the ${payload.cancelledBy}.`,
        `Patient: ${payload.patientName}`,
        `Doctor: ${payload.doctorName}`,
        `Date: ${payload.date}`,
        `Time: ${payload.startTime} - ${payload.endTime}`,
      ].join('\n'),
      html: `
        <p>Hello ${payload.staffName},</p>
        <p>An appointment was cancelled by the ${payload.cancelledBy}.</p>
        <p><strong>Patient:</strong> ${payload.patientName}</p>
        <p><strong>Doctor:</strong> ${payload.doctorName}</p>
        <p><strong>Date:</strong> ${payload.date}</p>
        <p><strong>Time:</strong> ${payload.startTime} - ${payload.endTime}</p>
      `,
      logContext: 'staff appointment cancelled',
    });
  }

  async sendDoctorNewAppointment(
    to: string,
    payload: {
      clinic?: ClinicEmailContext;
      doctorName: string;
      patientName: string;
      date: string;
      startTime: string;
      endTime: string;
      type: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to,
      clinic: payload.clinic,
      subject: 'New appointment assigned to you',
      text: [
        `Hello ${payload.doctorName},`,
        'A new appointment request has been assigned to you.',
        `Patient: ${payload.patientName}`,
        `Date: ${payload.date}`,
        `Time: ${payload.startTime} - ${payload.endTime}`,
        `Appointment type: ${payload.type || 'General appointment'}`,
      ].join('\n'),
      html: `
        <p>Hello ${payload.doctorName},</p>
        <p>A new appointment request has been assigned to you.</p>
        <p><strong>Patient:</strong> ${payload.patientName}</p>
        <p><strong>Date:</strong> ${payload.date}</p>
        <p><strong>Time:</strong> ${payload.startTime} - ${payload.endTime}</p>
        <p><strong>Appointment type:</strong> ${payload.type || 'General appointment'}</p>
      `,
      logContext: 'doctor new appointment',
    });
  }

  async sendDoctorAppointmentConfirmed(
    to: string,
    payload: {
      clinic?: ClinicEmailContext;
      doctorName: string;
      patientName: string;
      date: string;
      startTime: string;
      endTime: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to,
      clinic: payload.clinic,
      subject: 'Appointment confirmed',
      text: [
        `Hello ${payload.doctorName},`,
        'An appointment assigned to you has been confirmed.',
        `Patient: ${payload.patientName}`,
        `Date: ${payload.date}`,
        `Time: ${payload.startTime} - ${payload.endTime}`,
      ].join('\n'),
      html: `
        <p>Hello ${payload.doctorName},</p>
        <p>An appointment assigned to you has been confirmed.</p>
        <p><strong>Patient:</strong> ${payload.patientName}</p>
        <p><strong>Date:</strong> ${payload.date}</p>
        <p><strong>Time:</strong> ${payload.startTime} - ${payload.endTime}</p>
      `,
      logContext: 'doctor appointment confirmed',
    });
  }

  async sendDoctorAppointmentCancelled(
    to: string,
    payload: {
      clinic?: ClinicEmailContext;
      doctorName: string;
      patientName: string;
      date: string;
      startTime: string;
      endTime: string;
      cancelledBy: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to,
      clinic: payload.clinic,
      subject: 'Appointment cancelled',
      text: [
        `Hello ${payload.doctorName},`,
        `An appointment was cancelled by the ${payload.cancelledBy}.`,
        `Patient: ${payload.patientName}`,
        `Date: ${payload.date}`,
        `Time: ${payload.startTime} - ${payload.endTime}`,
      ].join('\n'),
      html: `
        <p>Hello ${payload.doctorName},</p>
        <p>An appointment was cancelled by the ${payload.cancelledBy}.</p>
        <p><strong>Patient:</strong> ${payload.patientName}</p>
        <p><strong>Date:</strong> ${payload.date}</p>
        <p><strong>Time:</strong> ${payload.startTime} - ${payload.endTime}</p>
      `,
      logContext: 'doctor appointment cancelled',
    });
  }

  private async sendEmail(params: {
    to: string;
    subject: string;
    text: string;
    html: string;
    clinic?: ClinicEmailContext;
    logContext: string;
  }) {
    try {
      await this.getTransporter().sendMail({
        from: this.getFromAddress(),
        to: params.to,
        replyTo: params.clinic?.clinicEmail || undefined,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send ${params.logContext} email to ${params.to}: ${
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
