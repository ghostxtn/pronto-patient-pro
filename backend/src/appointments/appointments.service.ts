import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, gte, lte, ne } from 'drizzle-orm';
import { AvailabilityService } from '../availability/availability.service';
import {
  isExpiredStartTime,
  rangeContains,
  rangesOverlap,
  timeToMinutes,
} from '../availability/calendar-time.utils';
import { appointmentNotes, appointments, doctors, patients, users } from '../database/schema';
import { EncryptionService } from '../encryption/encryption.service';
import { CreateAppointmentNoteDto } from './dto/create-appointment-note.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  private readonly NOTE_ENCRYPTED_FIELDS = ['diagnosis', 'treatment', 'prescription', 'notes'];
  private readonly PATIENT_ENCRYPTED_FIELDS = ['firstName', 'lastName', 'email'];

  constructor(
    @Inject('DRIZZLE') private readonly db: any,
    private readonly encryptionService: EncryptionService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async create(
    dto: CreateAppointmentDto,
    clinicId: string,
    userRole: string,
    userId: string,
  ) {
    const patientId = await this.resolvePatientId(
      dto.patientId,
      clinicId,
      userRole,
      userId,
    );

    await this.ensureDoctorInClinic(dto.doctorId, clinicId);
    await this.ensurePatientInClinic(patientId, clinicId);

    this.validateAppointmentRange(dto.appointmentDate, dto.startTime, dto.endTime);
    await this.assertRequestedRangeIsBookable(
      clinicId,
      dto.doctorId,
      dto.appointmentDate,
      dto.startTime,
      dto.endTime,
      userRole,
    );
    await this.assertNoAppointmentOverlap(
      clinicId,
      dto.doctorId,
      dto.appointmentDate,
      dto.startTime,
      dto.endTime,
    );

    const [appointment] = await this.db
      .insert(appointments)
      .values({
        clinic_id: clinicId,
        doctor_id: dto.doctorId,
        patient_id: patientId,
        appointment_date: dto.appointmentDate,
        start_time: dto.startTime,
        end_time: dto.endTime,
        status: 'pending',
        type: dto.type,
        notes: dto.notes,
      })
      .returning();

    return appointment;
  }

  async findAllByClinic(
    clinicId: string,
    filters?: {
      doctorId?: string;
      patientId?: string;
      date?: string;
      dateFrom?: string;
      dateTo?: string;
      status?: string;
    },
    currentUser?: {
      userId: string;
      role: string;
    },
  ) {
    const conditions = [eq(appointments.clinic_id, clinicId)];

    if (currentUser?.role === 'patient') {
      const [patient] = await this.db
        .select()
        .from(patients)
        .where(and(eq(patients.user_id, currentUser.userId), eq(patients.clinic_id, clinicId)))
        .limit(1);

      if (!patient) {
        throw new ForbiddenException('Patient record not found');
      }

      conditions.push(eq(appointments.patient_id, patient.id));
    }

    if (filters?.doctorId) {
      conditions.push(eq(appointments.doctor_id, filters.doctorId));
    }

    if (filters?.patientId) {
      conditions.push(eq(appointments.patient_id, filters.patientId));
    }

    if (filters?.date) {
      conditions.push(eq(appointments.appointment_date, filters.date));
    }

    if (filters?.dateFrom) {
      conditions.push(gte(appointments.appointment_date, filters.dateFrom));
    }

    if (filters?.dateTo) {
      conditions.push(lte(appointments.appointment_date, filters.dateTo));
    }

    if (filters?.status) {
      conditions.push(eq(appointments.status, filters.status));
    }

    const results = await this.db
      .select({
        id: appointments.id,
        clinic_id: appointments.clinic_id,
        doctor_id: appointments.doctor_id,
        patient_id: appointments.patient_id,
        appointment_date: appointments.appointment_date,
        start_time: appointments.start_time,
        end_time: appointments.end_time,
        status: appointments.status,
        type: appointments.type,
        notes: appointments.notes,
        created_at: appointments.created_at,
        updated_at: appointments.updated_at,
        patient: {
          id: patients.id,
          firstName: patients.first_name,
          lastName: patients.last_name,
          email: patients.email,
        },
        doctor: {
          id: doctors.id,
          firstName: users.first_name,
          lastName: users.last_name,
          email: users.email,
          title: doctors.title,
          phone: doctors.phone,
        },
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patient_id, patients.id))
      .innerJoin(doctors, eq(appointments.doctor_id, doctors.id))
      .innerJoin(users, eq(doctors.user_id, users.id))
      .where(and(...conditions));

    return Promise.all(
      results.map(async (row: any) => ({
        ...row,
        patient: row.patient
          ? await this.encryptionService.decryptFields(
              row.patient,
              this.PATIENT_ENCRYPTED_FIELDS,
              clinicId,
            )
          : row.patient,
      })),
    );
  }

  async findById(id: string, clinicId: string) {
    const [appointment] = await this.db
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, id), eq(appointments.clinic_id, clinicId)))
      .limit(1);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto, clinicId: string) {
    const currentAppointment = await this.findById(id, clinicId);

    await this.ensureDoctorInClinic(currentAppointment.doctor_id, clinicId);
    await this.ensurePatientInClinic(currentAppointment.patient_id, clinicId);

    const nextAppointmentDate =
      dto.appointmentDate ?? currentAppointment.appointment_date;
    const nextStartTime = dto.startTime ?? currentAppointment.start_time.slice(0, 5);
    const nextEndTime = dto.endTime ?? currentAppointment.end_time.slice(0, 5);
    const scheduleChanged =
      nextAppointmentDate !== currentAppointment.appointment_date ||
      nextStartTime !== currentAppointment.start_time.slice(0, 5) ||
      nextEndTime !== currentAppointment.end_time.slice(0, 5);

    if (scheduleChanged) {
      this.validateAppointmentRange(nextAppointmentDate, nextStartTime, nextEndTime);
      await this.assertRequestedRangeIsBookable(
        clinicId,
        currentAppointment.doctor_id,
        nextAppointmentDate,
        nextStartTime,
        nextEndTime,
        'staff',
      );
      await this.assertNoAppointmentOverlap(
        clinicId,
        currentAppointment.doctor_id,
        nextAppointmentDate,
        nextStartTime,
        nextEndTime,
        id,
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (dto.appointmentDate !== undefined) {
      updateData.appointment_date = dto.appointmentDate;
    }
    if (dto.startTime !== undefined) {
      updateData.start_time = dto.startTime;
    }
    if (dto.endTime !== undefined) {
      updateData.end_time = dto.endTime;
    }
    if (dto.type !== undefined) {
      updateData.type = dto.type;
    }
    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    const [appointment] = await this.db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, id))
      .returning();

    return appointment;
  }

  async updateStatus(id: string, status: string, clinicId: string) {
    await this.findById(id, clinicId);

    const [appointment] = await this.db
      .update(appointments)
      .set({
        status,
        updated_at: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning();

    return appointment;
  }

  async softDelete(id: string, clinicId: string) {
    await this.findById(id, clinicId);

    const [appointment] = await this.db
      .update(appointments)
      .set({
        status: 'cancelled',
        updated_at: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning();

    return appointment;
  }

  async createNote(
    appointmentId: string,
    dto: CreateAppointmentNoteDto,
    doctorId: string,
    clinicId: string,
  ) {
    await this.findById(appointmentId, clinicId);

    const rawValues = {
      appointment_id: appointmentId,
      clinic_id: clinicId,
      doctor_id: doctorId,
      diagnosis: dto.diagnosis,
      treatment: dto.treatment,
      prescription: dto.prescription,
      notes: dto.notes,
    };
    const encrypted = await this.encryptionService.encryptFields(
      rawValues,
      this.NOTE_ENCRYPTED_FIELDS,
      clinicId,
    );
    const [note] = await this.db
      .insert(appointmentNotes)
      .values(encrypted)
      .returning();

    return this.encryptionService.decryptFields(
      note,
      this.NOTE_ENCRYPTED_FIELDS,
      clinicId,
    );
  }

  async findNotesByAppointment(appointmentId: string, clinicId: string) {
    const results = await this.db
      .select()
      .from(appointmentNotes)
      .where(
        and(
          eq(appointmentNotes.appointment_id, appointmentId),
          eq(appointmentNotes.clinic_id, clinicId),
        ),
      );

    return Promise.all(
      results.map((n: any) =>
        this.encryptionService.decryptFields(
          n,
          this.NOTE_ENCRYPTED_FIELDS,
          clinicId,
        ),
      ),
    );
  }

  async updateNote(
    noteId: string,
    dto: Partial<CreateAppointmentNoteDto>,
    clinicId: string,
  ) {
    const [existingNote] = await this.db
      .select()
      .from(appointmentNotes)
      .where(
        and(
          eq(appointmentNotes.id, noteId),
          eq(appointmentNotes.clinic_id, clinicId),
        ),
      )
      .limit(1);

    if (!existingNote) {
      throw new NotFoundException('Appointment note not found');
    }

    const fieldsToEncrypt = this.NOTE_ENCRYPTED_FIELDS.filter(
      (f) => (dto as any)[f] !== undefined,
    );
    const encryptedDto = await this.encryptionService.encryptFields(
      { ...dto },
      fieldsToEncrypt,
      clinicId,
    );
    const [note] = await this.db
      .update(appointmentNotes)
      .set({
        ...encryptedDto,
        updated_at: new Date(),
      })
      .where(eq(appointmentNotes.id, noteId))
      .returning();

    return this.encryptionService.decryptFields(
      note,
      this.NOTE_ENCRYPTED_FIELDS,
      clinicId,
    );
  }

  async deleteNote(noteId: string, clinicId: string) {
    const [existingNote] = await this.db
      .select()
      .from(appointmentNotes)
      .where(
        and(
          eq(appointmentNotes.id, noteId),
          eq(appointmentNotes.clinic_id, clinicId),
        ),
      )
      .limit(1);

    if (!existingNote) {
      throw new NotFoundException('Appointment note not found');
    }

    const [deletedNote] = await this.db
      .delete(appointmentNotes)
      .where(eq(appointmentNotes.id, noteId))
      .returning();

    return this.encryptionService.decryptFields(
      deletedNote,
      this.NOTE_ENCRYPTED_FIELDS,
      clinicId,
    );
  }

  private async resolvePatientId(
    patientId: string,
    clinicId: string,
    userRole: string,
    userId: string,
  ) {
    if (userRole !== 'patient') {
      return patientId;
    }

    const [patient] = await this.db
      .select()
      .from(patients)
      .where(and(eq(patients.user_id, userId), eq(patients.clinic_id, clinicId)))
      .limit(1);

    if (!patient) {
      throw new ForbiddenException('Patient record not found');
    }

    return patient.id;
  }

  private async ensureDoctorInClinic(doctorId: string, clinicId: string) {
    const [doctor] = await this.db
      .select({ id: doctors.id })
      .from(doctors)
      .where(and(eq(doctors.id, doctorId), eq(doctors.clinic_id, clinicId)))
      .limit(1);

    if (!doctor) {
      throw new NotFoundException('Doctor not found in this clinic');
    }
  }

  private async ensurePatientInClinic(patientId: string, clinicId: string) {
    const [patient] = await this.db
      .select({ id: patients.id })
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.clinic_id, clinicId)))
      .limit(1);

    if (!patient) {
      throw new NotFoundException('Patient not found in this clinic');
    }
  }

  private validateAppointmentRange(
    appointmentDate: string,
    startTime: string,
    endTime: string,
  ) {
    if (startTime >= endTime) {
      throw new ForbiddenException('Appointment end time must be after start time');
    }

    if (isExpiredStartTime(appointmentDate, startTime)) {
      throw new ForbiddenException('Requested appointment time has expired');
    }
  }

  private async assertRequestedRangeIsBookable(
    clinicId: string,
    doctorId: string,
    appointmentDate: string,
    startTime: string,
    endTime: string,
    userRole: string,
  ) {
    const availabilityContext = await this.availabilityService.getAvailabilityContext(
      clinicId,
      doctorId,
      appointmentDate,
    );
    const bookableSlotEntries =
      userRole === 'patient'
        ? await this.availabilityService.getBookableSlots(
            clinicId,
            doctorId,
            appointmentDate,
          )
        : availabilityContext.slotEntries;
    const requestedRange = {
      start: timeToMinutes(startTime),
      end: timeToMinutes(endTime),
    };
    const hasBookableStart = bookableSlotEntries.some(
      (slotEntry: { startTime: string }) => slotEntry.startTime === startTime,
    );
    const hasFullCoverage = availabilityContext.availabilityRanges.some((range) =>
      rangeContains(range, requestedRange),
    );

    if (!hasBookableStart || !hasFullCoverage) {
      throw new ForbiddenException('Requested time range is not bookable');
    }
  }

  // Keep overlap as a separate invariant so expired/not-bookable/overlap stay distinct.
  private async assertNoAppointmentOverlap(
    clinicId: string,
    doctorId: string,
    appointmentDate: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: string,
  ) {
    const conditions = [
      eq(appointments.clinic_id, clinicId),
      eq(appointments.doctor_id, doctorId),
      eq(appointments.appointment_date, appointmentDate),
      ne(appointments.status, 'cancelled'),
    ];

    if (excludeAppointmentId) {
      conditions.push(ne(appointments.id, excludeAppointmentId));
    }

    const existingAppointments = await this.db
      .select({
        start_time: appointments.start_time,
        end_time: appointments.end_time,
      })
      .from(appointments)
      .where(and(...conditions));

    const requestedRange = {
      start: timeToMinutes(startTime),
      end: timeToMinutes(endTime),
    };
    const hasOverlap = existingAppointments.some((appointment: {
      start_time: string;
      end_time: string;
    }) =>
      rangesOverlap(
        requestedRange,
        {
          start: timeToMinutes(appointment.start_time),
          end: timeToMinutes(appointment.end_time),
        },
      ),
    );

    if (hasOverlap) {
      throw new ForbiddenException('Doctor already has an appointment in this time range');
    }
  }
}
