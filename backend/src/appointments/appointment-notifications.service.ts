import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { appointments, clinics, doctors, patients, users } from '../database/schema';
import { EmailService } from '../email/email.service';
import { EncryptionService } from '../encryption/encryption.service';
import {
  isConfirmedAppointmentStatus,
  isDeclinedAppointmentStatus,
  isReminderEligibleAppointmentStatus,
  normalizeAppointmentStatus,
} from './appointment-status.utils';

type AppointmentRecord = {
  id: string;
  clinic_id: string;
  doctor_id: string;
  patient_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  type?: string | null;
  reminder_sent_at?: Date | null;
};

export type NotificationActorRole =
  | 'owner'
  | 'admin'
  | 'doctor'
  | 'staff'
  | 'patient'
  | 'system';

type Recipient = {
  email: string;
  name: string;
};

type ClinicContext = {
  clinicId: string;
  clinicName: string;
  clinicDomain: string;
  clinicEmail: string | null;
};

type AppointmentNotificationContext = {
  clinic: ClinicContext;
  appointment: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
    status: string;
  };
  patient: {
    name: string;
    email: string | null;
  };
  doctor: {
    name: string;
    email: string | null;
  };
  staffRecipients: Recipient[];
};

@Injectable()
export class AppointmentNotificationsService {
  private readonly logger = new Logger(AppointmentNotificationsService.name);
  private readonly patientEncryptedFields = [
    'patientFirst',
    'patientLast',
    'patientEmail',
  ];
  private reminderSchemaVerified = false;

  constructor(
    @Inject('DRIZZLE') private readonly db: any,
    private readonly encryptionService: EncryptionService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async notifyAppointmentCreated(appointment: AppointmentRecord, clinicId: string) {
    const context = await this.buildNotificationContext(appointment, clinicId);

    if (context.patient.email) {
      void this.emailService.sendAppointmentCreated(context.patient.email, {
        clinic: context.clinic,
        patientName: context.patient.name,
        doctorName: context.doctor.name,
        date: context.appointment.date,
        startTime: context.appointment.startTime,
        endTime: context.appointment.endTime,
        type: context.appointment.type,
      });
    }

    for (const staffRecipient of context.staffRecipients) {
      void this.emailService.sendStaffNewAppointment(staffRecipient.email, {
        clinic: context.clinic,
        staffName: staffRecipient.name,
        doctorName: context.doctor.name,
        patientName: context.patient.name,
        date: context.appointment.date,
        startTime: context.appointment.startTime,
        endTime: context.appointment.endTime,
        type: context.appointment.type,
      });
    }

    if (context.doctor.email) {
      void this.emailService.sendDoctorNewAppointment(context.doctor.email, {
        clinic: context.clinic,
        doctorName: context.doctor.name,
        patientName: context.patient.name,
        date: context.appointment.date,
        startTime: context.appointment.startTime,
        endTime: context.appointment.endTime,
        type: context.appointment.type,
      });
    }

    this.logger.log(
      `Queued appointment-created notifications for appointment ${appointment.id} in clinic ${clinicId}`,
    );
  }

  async notifyStatusChanged(
    appointment: AppointmentRecord,
    previousStatus: string,
    actorRole: NotificationActorRole,
  ) {
    const normalizedPrevious = normalizeAppointmentStatus(previousStatus);
    const normalizedNext = normalizeAppointmentStatus(appointment.status);

    if (normalizedPrevious === normalizedNext) {
      return;
    }

    if (normalizedNext === 'cancelled') {
      await this.notifyAppointmentCancelled(appointment, actorRole);
      return;
    }

    const context = await this.buildNotificationContext(
      appointment,
      appointment.clinic_id,
    );

    if (isConfirmedAppointmentStatus(normalizedNext)) {
      if (context.patient.email) {
        void this.emailService.sendAppointmentConfirmed(context.patient.email, {
          clinic: context.clinic,
          patientName: context.patient.name,
          doctorName: context.doctor.name,
          date: context.appointment.date,
          startTime: context.appointment.startTime,
          endTime: context.appointment.endTime,
        });
      }

      if (context.doctor.email) {
        void this.emailService.sendDoctorAppointmentConfirmed(context.doctor.email, {
          clinic: context.clinic,
          doctorName: context.doctor.name,
          patientName: context.patient.name,
          date: context.appointment.date,
          startTime: context.appointment.startTime,
          endTime: context.appointment.endTime,
        });
      }

      this.logger.log(
        `Queued appointment-confirmed notifications for appointment ${appointment.id}`,
      );
      return;
    }

    if (isDeclinedAppointmentStatus(normalizedNext) && context.patient.email) {
      void this.emailService.sendAppointmentDeclined(context.patient.email, {
        clinic: context.clinic,
        patientName: context.patient.name,
        doctorName: context.doctor.name,
        date: context.appointment.date,
        startTime: context.appointment.startTime,
        endTime: context.appointment.endTime,
      });

      this.logger.log(
        `Queued appointment-declined notification for appointment ${appointment.id}`,
      );
    }
  }

  async notifyAppointmentCancelled(
    appointment: AppointmentRecord,
    actorRole: NotificationActorRole,
  ) {
    const context = await this.buildNotificationContext(
      appointment,
      appointment.clinic_id,
    );
    const cancelledBy = this.describeCancellationActor(actorRole);

    if (context.patient.email) {
      void this.emailService.sendAppointmentCancelled(context.patient.email, {
        clinic: context.clinic,
        patientName: context.patient.name,
        doctorName: context.doctor.name,
        date: context.appointment.date,
        startTime: context.appointment.startTime,
        endTime: context.appointment.endTime,
        cancelledBy,
      });
    }

    for (const staffRecipient of context.staffRecipients) {
      void this.emailService.sendStaffAppointmentCancelled(staffRecipient.email, {
        clinic: context.clinic,
        staffName: staffRecipient.name,
        patientName: context.patient.name,
        doctorName: context.doctor.name,
        date: context.appointment.date,
        startTime: context.appointment.startTime,
        endTime: context.appointment.endTime,
        cancelledBy,
      });
    }

    if (context.doctor.email) {
      void this.emailService.sendDoctorAppointmentCancelled(context.doctor.email, {
        clinic: context.clinic,
        doctorName: context.doctor.name,
        patientName: context.patient.name,
        date: context.appointment.date,
        startTime: context.appointment.startTime,
        endTime: context.appointment.endTime,
        cancelledBy,
      });
    }

    this.logger.log(
      `Queued appointment-cancelled notifications for appointment ${appointment.id}`,
    );
  }

  async processDueReminders() {
    await this.ensureReminderSchemaReady();

    const reminderLeadHours = Math.max(
      1,
      Number(this.configService.get<string>('APPOINTMENT_REMINDER_LEAD_HOURS', '24')),
    );
    const reminderWindowMinutes = Math.max(
      1,
      Number(this.configService.get<string>('APPOINTMENT_REMINDER_WINDOW_MINUTES', '10')),
    );
    const now = new Date();
    const windowStart = new Date(now.getTime() + reminderLeadHours * 60 * 60 * 1000);
    const windowEnd = new Date(
      windowStart.getTime() + reminderWindowMinutes * 60 * 1000,
    );

    this.logger.debug(
      `Running reminder pass for window ${windowStart.toISOString()} -> ${windowEnd.toISOString()}`,
    );

    const rows = (await this.db
      .select()
      .from(appointments)
      .where(
        and(
          isNull(appointments.reminder_sent_at),
          gte(appointments.appointment_date, this.toDateOnly(windowStart)),
          lte(appointments.appointment_date, this.toDateOnly(windowEnd)),
        ),
      )) as AppointmentRecord[];

    this.logger.debug(`Reminder candidate query returned ${rows.length} appointment(s)`);

    const dueAppointments = rows.filter((appointment) => {
      if (!isReminderEligibleAppointmentStatus(appointment.status)) {
        return false;
      }

      const appointmentStart = this.toAppointmentDateTime(
        appointment.appointment_date,
        appointment.start_time,
      );

      return appointmentStart >= windowStart && appointmentStart <= windowEnd;
    });

    this.logger.debug(
      `Reminder pass resolved ${dueAppointments.length} due appointment(s) after status/time filtering`,
    );

    for (const appointment of dueAppointments) {
      const context = await this.buildNotificationContext(
        appointment,
        appointment.clinic_id,
      );

      if (!context.patient.email) {
        continue;
      }

      await this.emailService.sendAppointmentReminder(context.patient.email, {
        clinic: context.clinic,
        patientName: context.patient.name,
        doctorName: context.doctor.name,
        date: context.appointment.date,
        startTime: context.appointment.startTime,
        endTime: context.appointment.endTime,
        type: context.appointment.type,
        reminderLeadHours,
      });

      await this.db
        .update(appointments)
        .set({
          reminder_sent_at: new Date(),
          updated_at: new Date(),
        })
        .where(
          and(
            eq(appointments.id, appointment.id),
            eq(appointments.clinic_id, appointment.clinic_id),
          ),
        );

      this.logger.log(
        `Sent appointment reminder for appointment ${appointment.id} in clinic ${appointment.clinic_id}`,
      );
    }
  }

  private async ensureReminderSchemaReady() {
    if (this.reminderSchemaVerified) {
      return;
    }

    const result = await this.db.execute(sql`
      select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'appointments'
          and column_name = 'reminder_sent_at'
      ) as "hasReminderSentAt"
    `);

    const hasReminderSentAt = Boolean(
      (result as { rows?: Array<{ hasReminderSentAt?: boolean }> })?.rows?.[0]
        ?.hasReminderSentAt,
    );

    if (!hasReminderSentAt) {
      throw new Error(
        'appointments.reminder_sent_at is missing from the active database schema. Apply the latest Drizzle migrations before running appointment reminders.',
      );
    }

    this.reminderSchemaVerified = true;
  }

  private async buildNotificationContext(
    appointment: AppointmentRecord,
    clinicId: string,
  ): Promise<AppointmentNotificationContext> {
    const [clinic, patientRow, doctorRow, staffRows] = await Promise.all([
      this.getClinicContext(clinicId),
      this.getPatientNotificationData(appointment.patient_id, clinicId),
      this.getDoctorNotificationData(appointment.doctor_id, clinicId),
      this.getStaffRecipients(clinicId),
    ]);

    return {
      clinic,
      appointment: {
        id: appointment.id,
        date: appointment.appointment_date,
        startTime: this.formatTime(appointment.start_time),
        endTime: this.formatTime(appointment.end_time),
        type: appointment.type ?? '',
        status: normalizeAppointmentStatus(appointment.status),
      },
      patient: patientRow,
      doctor: doctorRow,
      staffRecipients: staffRows,
    };
  }

  private async getClinicContext(clinicId: string): Promise<ClinicContext> {
    const [clinic] = await this.db
      .select({
        id: clinics.id,
        name: clinics.name,
        domain: clinics.domain,
        email: clinics.email,
      })
      .from(clinics)
      .where(eq(clinics.id, clinicId))
      .limit(1);

    if (!clinic) {
      throw new NotFoundException('Clinic notification context not found');
    }

    return {
      clinicId: clinic.id,
      clinicName: clinic.name,
      clinicDomain: clinic.domain,
      clinicEmail: clinic.email,
    };
  }

  private async getPatientNotificationData(patientId: string, clinicId: string) {
    const [row] = await this.db
      .select({
        patientFirst: patients.first_name,
        patientLast: patients.last_name,
        patientEmail: patients.email,
      })
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.clinic_id, clinicId)))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Patient notification context not found');
    }

    const decryptedPatient = await this.encryptionService.decryptFields(
      row,
      this.patientEncryptedFields,
      clinicId,
    );

    return {
      name:
        `${decryptedPatient.patientFirst ?? ''} ${decryptedPatient.patientLast ?? ''}`.trim(),
      email: decryptedPatient.patientEmail as string | null,
    };
  }

  private async getDoctorNotificationData(doctorId: string, clinicId: string) {
    const [row] = await this.db
      .select({
        firstName: users.first_name,
        lastName: users.last_name,
        email: users.email,
      })
      .from(doctors)
      .innerJoin(users, eq(users.id, doctors.user_id))
      .where(and(eq(doctors.id, doctorId), eq(doctors.clinic_id, clinicId)))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Doctor notification context not found');
    }

    return {
      name: `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim(),
      email: row.email,
    };
  }

  private async getStaffRecipients(clinicId: string): Promise<Recipient[]> {
    const rows = await this.db
      .select({
        email: users.email,
        firstName: users.first_name,
        lastName: users.last_name,
      })
      .from(users)
      .where(and(eq(users.clinic_id, clinicId), eq(users.role, 'staff')));

    return rows
      .filter((row: { email: string | null }) => Boolean(row.email))
      .map((row: { email: string; firstName: string; lastName: string }) => ({
        email: row.email,
        name: `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() || 'Staff',
      }));
  }

  private describeCancellationActor(actorRole: NotificationActorRole) {
    switch (actorRole) {
      case 'patient':
        return 'patient';
      case 'doctor':
        return 'doctor';
      case 'staff':
      case 'admin':
      case 'owner':
        return 'clinic';
      default:
        return 'system';
    }
  }

  private formatTime(value: string) {
    return value.slice(0, 5);
  }

  private toAppointmentDateTime(date: string, time: string) {
    return new Date(`${date}T${time.slice(0, 8)}`);
  }

  private toDateOnly(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
