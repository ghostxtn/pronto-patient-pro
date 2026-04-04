import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, lte, ne, or } from 'drizzle-orm';
import { appointmentNotes, appointments, doctors, patients, users } from '../database/schema';
import { AvailabilityService } from '../availability/availability.service';
import { EncryptionService } from '../encryption/encryption.service';
import { CreateAppointmentNoteDto } from './dto/create-appointment-note.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  private readonly NOTE_ENCRYPTED_FIELDS = ['diagnosis', 'treatment', 'prescription', 'notes'];
  private readonly PATIENT_ENCRYPTED_FIELDS = ['firstName', 'lastName', 'email'];
  private readonly CLINIC_TIME_ZONE = 'Europe/Istanbul';

  constructor(
    @Inject('DRIZZLE') private readonly db: any,
    private readonly encryptionService: EncryptionService,
    private readonly availabilityService: AvailabilityService,
  ) {}

  async create(dto: CreateAppointmentDto, clinicId: string, userRole: string, userId: string) {
    if (userRole === 'patient') {
      const [patient] = await this.db
        .select()
        .from(patients)
        .where(and(eq(patients.user_id, userId), eq(patients.clinic_id, clinicId)))
        .limit(1);

      if (!patient) {
        throw new ForbiddenException('Patient record not found');
      }

      // Patient her zaman kendi adına randevu alır, patientId'yi override et
      dto.patientId = patient.id;
    }

    const [doctor] = await this.db
      .select({
        id: doctors.id,
        is_active: doctors.is_active,
      })
      .from(doctors)
      .where(and(eq(doctors.id, dto.doctorId), eq(doctors.clinic_id, clinicId)))
      .limit(1);

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    if (!doctor.is_active) {
      throw new BadRequestException('Inactive doctors cannot be booked');
    }

    this.assertAppointmentNotInPast(dto.appointmentDate, dto.startTime);

    const bookableSlots = await this.availabilityService.getBookableSlotDetails(
      clinicId,
      dto.doctorId,
      dto.appointmentDate,
    );
    const selectedSlot = bookableSlots.find((slot) => slot.startTime === dto.startTime);

    if (!selectedSlot) {
      throw new BadRequestException(
        'Appointment must be created from a valid available slot',
      );
    }

    const normalizedEndTime = selectedSlot.endTime;

    if (userRole !== 'patient' && dto.endTime !== normalizedEndTime) {
      throw new BadRequestException(
        'Appointment end time must match the doctor slot duration',
      );
    }

    const overlappingAppointments = await this.db
      .select({
        id: appointments.id,
        start_time: appointments.start_time,
        end_time: appointments.end_time,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.clinic_id, clinicId),
          eq(appointments.doctor_id, dto.doctorId),
          eq(appointments.appointment_date, dto.appointmentDate),
          ne(appointments.status, 'cancelled'),
        ),
      );

    const hasOverlap = overlappingAppointments.some(
      (appointment: { start_time: string; end_time: string }) =>
        dto.startTime < appointment.end_time.slice(0, 5) &&
        normalizedEndTime > appointment.start_time.slice(0, 5),
    );

    if (hasOverlap) {
      throw new ConflictException('Appointment overlaps with an existing booking');
    }

    const [appointment] = await this.db
      .insert(appointments)
      .values({
        clinic_id: clinicId,
        doctor_id: dto.doctorId,
        patient_id: dto.patientId,
        appointment_date: dto.appointmentDate,
        start_time: dto.startTime,
        end_time: normalizedEndTime,
        status: 'pending',
        type: dto.type,
        notes: dto.notes,
      })
      .returning();

    return this.normalizeAppointmentStatus(appointment);
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

    const normalizedStatus = filters?.status
      ? this.normalizeStatus(filters.status, false)
      : undefined;

    if (normalizedStatus === 'confirmed') {
      conditions.push(
        or(
          eq(appointments.status, 'confirmed'),
          eq(appointments.status, 'scheduled'),
        )!,
      );
    } else if (normalizedStatus) {
      conditions.push(eq(appointments.status, normalizedStatus));
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
        ...this.normalizeAppointmentStatus(row),
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

    return this.normalizeAppointmentStatus(appointment);
  }

  async update(id: string, dto: UpdateAppointmentDto, clinicId: string) {
    const currentAppointment = await this.findById(id, clinicId);
    const nextAppointmentDate = dto.appointmentDate ?? currentAppointment.appointment_date;
    const nextStartTime = dto.startTime ?? currentAppointment.start_time.slice(0, 5);

    this.assertAppointmentNotInPast(nextAppointmentDate, nextStartTime);

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

    return this.normalizeAppointmentStatus(appointment);
  }

  async updateStatus(
    id: string,
    status: string,
    currentUser: {
      clinicId: string;
      role: string;
      userId: string;
    },
  ) {
    const appointment = await this.findById(id, currentUser.clinicId);
    const normalizedStatus = this.normalizeStatus(status);

    if (currentUser.role === 'doctor') {
      const [doctorRecord] = await this.db
        .select({
          id: doctors.id,
        })
        .from(doctors)
        .where(
          and(
            eq(doctors.user_id, currentUser.userId),
            eq(doctors.clinic_id, currentUser.clinicId),
          ),
        )
        .limit(1);

      if (!doctorRecord || doctorRecord.id !== appointment.doctor_id) {
        throw new ForbiddenException('Doctors can only update their own appointments');
      }

      if (normalizedStatus !== 'completed') {
        throw new ForbiddenException(
          'Doctors are limited to completing their own confirmed appointments',
        );
      }
    }

    if (normalizedStatus === 'completed' && appointment.status !== 'confirmed') {
      throw new BadRequestException('Only confirmed appointments can be completed');
    }

    const [updatedAppointment] = await this.db
      .update(appointments)
      .set({
        status: normalizedStatus,
        updated_at: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning();

    return this.normalizeAppointmentStatus(updatedAppointment);
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

    return this.normalizeAppointmentStatus(appointment);
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

  private normalizeStatus(
    status: string,
    throwOnUnknown: boolean = true,
  ): 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | undefined {
    const normalized = status === 'scheduled' ? 'confirmed' : status;

    if (
      normalized === 'pending' ||
      normalized === 'confirmed' ||
      normalized === 'completed' ||
      normalized === 'cancelled' ||
      normalized === 'no_show'
    ) {
      return normalized;
    }

    if (throwOnUnknown) {
      throw new BadRequestException('Invalid appointment status');
    }

    return undefined;
  }

  private normalizeAppointmentStatus<T extends { status?: string }>(appointment: T): T {
    if (!appointment?.status) {
      return appointment;
    }

    return {
      ...appointment,
      status: this.normalizeStatus(appointment.status, false) ?? appointment.status,
    };
  }

  private assertAppointmentNotInPast(appointmentDate: string, startTime: string) {
    const clinicNow = this.getClinicNowParts();

    if (appointmentDate < clinicNow.date) {
      throw new BadRequestException('Past appointment dates cannot be booked');
    }

    if (appointmentDate === clinicNow.date) {
      const slotMinutes = this.timeToMinutes(startTime);
      if (slotMinutes <= clinicNow.minutes) {
        throw new BadRequestException('Past times on the current day cannot be booked');
      }
    }
  }

  private getClinicNowParts(): { date: string; minutes: number } {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.CLINIC_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(new Date());
    const getPart = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? '00';

    return {
      date: `${getPart('year')}-${getPart('month')}-${getPart('day')}`,
      minutes: Number(getPart('hour')) * 60 + Number(getPart('minute')),
    };
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
    return hours * 60 + minutes;
  }
}
