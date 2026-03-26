import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { and, desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  appointments,
  doctors,
  patientClinicalNotes,
  patients,
  users,
} from '../database/schema';
import * as schema from '../database/schema';
import { EncryptionService } from '../encryption/encryption.service';
import { CreateClinicalNoteDto } from './dto/create-clinical-note.dto';
import { UpdateClinicalNoteDto } from './dto/update-clinical-note.dto';

@Injectable()
export class PatientClinicalNotesService {
  private readonly ENCRYPTED_FIELDS = ['diagnosis', 'treatment', 'prescription', 'notes'];

  constructor(
    @Inject('DRIZZLE')
    private readonly db: NodePgDatabase<typeof schema>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async listByPatient(patientId: string, clinicId: string) {
    await this.ensurePatientInClinic(patientId, clinicId);

    const results = await this.db
      .select({
        id: patientClinicalNotes.id,
        clinic_id: patientClinicalNotes.clinic_id,
        patient_id: patientClinicalNotes.patient_id,
        doctor_id: patientClinicalNotes.doctor_id,
        appointment_id: patientClinicalNotes.appointment_id,
        diagnosis: patientClinicalNotes.diagnosis,
        treatment: patientClinicalNotes.treatment,
        prescription: patientClinicalNotes.prescription,
        notes: patientClinicalNotes.notes,
        expires_at: patientClinicalNotes.expires_at,
        created_at: patientClinicalNotes.created_at,
        updated_at: patientClinicalNotes.updated_at,
        doctor: {
          firstName: users.first_name,
          lastName: users.last_name,
          title: doctors.title,
        },
      })
      .from(patientClinicalNotes)
      .innerJoin(doctors, eq(patientClinicalNotes.doctor_id, doctors.id))
      .innerJoin(users, eq(doctors.user_id, users.id))
      .where(
        and(
          eq(patientClinicalNotes.patient_id, patientId),
          eq(patientClinicalNotes.clinic_id, clinicId),
        ),
      )
      .orderBy(desc(patientClinicalNotes.created_at));

    return Promise.all(
      results.map(async (row: any) => ({
        ...(await this.encryptionService.decryptFields(
          row,
          this.ENCRYPTED_FIELDS,
          clinicId,
        )),
        doctor: row.doctor,
      })),
    );
  }

  async create(dto: CreateClinicalNoteDto, clinicId: string) {
    this.ensureContentFieldsPresent(dto);
    await this.ensurePatientInClinic(dto.patient_id, clinicId);
    await this.ensureDoctorInClinic(dto.doctor_id, clinicId);
    await this.ensureAppointmentInClinic(dto.appointment_id, clinicId);

    const rawValues = {
      clinic_id: clinicId,
      patient_id: dto.patient_id,
      doctor_id: dto.doctor_id,
      appointment_id: dto.appointment_id ?? null,
      diagnosis: dto.diagnosis,
      treatment: dto.treatment,
      prescription: dto.prescription,
      notes: dto.notes,
    };
    const encrypted = await this.encryptionService.encryptFields(
      rawValues,
      this.ENCRYPTED_FIELDS,
      clinicId,
    );
    const [note] = await this.db
      .insert(patientClinicalNotes)
      .values(encrypted as any)
      .returning();

    return this.encryptionService.decryptFields(
      note,
      this.ENCRYPTED_FIELDS,
      clinicId,
    );
  }

  async update(id: string, dto: UpdateClinicalNoteDto, clinicId: string) {
    const existingNote = await this.findById(id, clinicId);

    const nextPatientId = dto.patient_id ?? existingNote.patient_id;
    const nextDoctorId = dto.doctor_id ?? existingNote.doctor_id;
    const nextAppointmentId =
      dto.appointment_id !== undefined
        ? dto.appointment_id
        : existingNote.appointment_id;

    const nextContent = {
      diagnosis:
        dto.diagnosis !== undefined ? dto.diagnosis : existingNote.diagnosis,
      treatment:
        dto.treatment !== undefined ? dto.treatment : existingNote.treatment,
      prescription:
        dto.prescription !== undefined
          ? dto.prescription
          : existingNote.prescription,
      notes: dto.notes !== undefined ? dto.notes : existingNote.notes,
    };

    this.ensureContentFieldsPresent(nextContent);
    await this.ensurePatientInClinic(nextPatientId, clinicId);
    await this.ensureDoctorInClinic(nextDoctorId, clinicId);
    await this.ensureAppointmentInClinic(nextAppointmentId ?? undefined, clinicId);

    const updatePayload: Record<string, any> = {
      ...(dto.patient_id !== undefined ? { patient_id: dto.patient_id } : {}),
      ...(dto.doctor_id !== undefined ? { doctor_id: dto.doctor_id } : {}),
      ...(dto.appointment_id !== undefined ? { appointment_id: dto.appointment_id } : {}),
      ...(dto.diagnosis !== undefined ? { diagnosis: dto.diagnosis } : {}),
      ...(dto.treatment !== undefined ? { treatment: dto.treatment } : {}),
      ...(dto.prescription !== undefined ? { prescription: dto.prescription } : {}),
      ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      updated_at: new Date(),
    };

    const fieldsToEncrypt = this.ENCRYPTED_FIELDS.filter(
      (f) => updatePayload[f] !== undefined,
    );
    const encryptedPayload = await this.encryptionService.encryptFields(
      updatePayload,
      fieldsToEncrypt,
      clinicId,
    );

    const [note] = await this.db
      .update(patientClinicalNotes)
      .set(encryptedPayload)
      .where(
        and(
          eq(patientClinicalNotes.id, id),
          eq(patientClinicalNotes.clinic_id, clinicId),
        ),
      )
      .returning();

    return this.encryptionService.decryptFields(
      note,
      this.ENCRYPTED_FIELDS,
      clinicId,
    );
  }

  async remove(id: string, clinicId: string) {
    await this.findById(id, clinicId);

    const [deletedNote] = await this.db
      .delete(patientClinicalNotes)
      .where(
        and(
          eq(patientClinicalNotes.id, id),
          eq(patientClinicalNotes.clinic_id, clinicId),
        ),
      )
      .returning();

    return this.encryptionService.decryptFields(
      deletedNote,
      this.ENCRYPTED_FIELDS,
      clinicId,
    );
  }

  private async findById(id: string, clinicId: string) {
    const [note] = await this.db
      .select()
      .from(patientClinicalNotes)
      .where(
        and(
          eq(patientClinicalNotes.id, id),
          eq(patientClinicalNotes.clinic_id, clinicId),
        ),
      )
      .limit(1);

    if (!note) {
      throw new NotFoundException('Clinical note not found');
    }

    return this.encryptionService.decryptFields(
      note,
      this.ENCRYPTED_FIELDS,
      clinicId,
    );
  }

  private async ensurePatientInClinic(patientId: string, clinicId: string) {
    if (!isUUID(patientId)) {
      throw new NotFoundException('Patient not found');
    }

    const [patient] = await this.db
      .select({ id: patients.id })
      .from(patients)
      .where(and(eq(patients.id, patientId), eq(patients.clinic_id, clinicId)))
      .limit(1);

    if (!patient) {
      throw new BadRequestException('Patient does not belong to this clinic');
    }
  }

  private async ensureDoctorInClinic(doctorId: string, clinicId: string) {
    if (!isUUID(doctorId)) {
      throw new NotFoundException('Doctor not found');
    }

    const [doctor] = await this.db
      .select({ id: doctors.id })
      .from(doctors)
      .where(and(eq(doctors.id, doctorId), eq(doctors.clinic_id, clinicId)))
      .limit(1);

    if (!doctor) {
      throw new BadRequestException('Doctor does not belong to this clinic');
    }
  }

  private async ensureAppointmentInClinic(
    appointmentId: string | undefined,
    clinicId: string,
  ) {
    if (!appointmentId) {
      return;
    }

    const [appointment] = await this.db
      .select({
        id: appointments.id,
        patient_id: appointments.patient_id,
        doctor_id: appointments.doctor_id,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.id, appointmentId),
          eq(appointments.clinic_id, clinicId),
        ),
      )
      .limit(1);

    if (!appointment) {
      throw new BadRequestException(
        'Appointment does not belong to this clinic',
      );
    }
  }

  private ensureContentFieldsPresent(content: {
    diagnosis?: string | null;
    treatment?: string | null;
    prescription?: string | null;
    notes?: string | null;
  }) {
    const hasContent = [
      content.diagnosis,
      content.treatment,
      content.prescription,
      content.notes,
    ].some((field) => typeof field === 'string' && field.trim().length > 0);

    if (!hasContent) {
      throw new BadRequestException(
        'At least one of diagnosis, treatment, prescription, or notes must be provided',
      );
    }
  }
}
