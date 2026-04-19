import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { unlink } from 'fs/promises';
import { and, eq } from 'drizzle-orm';
import { appointmentFiles, appointments, doctors, patients, users } from '../database/schema';
import { validateImageMagicBytes } from '../common/utils/magic-bytes.util';

@Injectable()
export class StorageService {
  private readonly PDF_MAGIC_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46]);

  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  private async getDoctorIdByUserId(userId: string, clinicId: string) {
    const [doctor] = await this.db
      .select({ id: doctors.id })
      .from(doctors)
      .where(and(eq(doctors.user_id, userId), eq(doctors.clinic_id, clinicId)))
      .limit(1);

    if (!doctor) {
      throw new ForbiddenException('Doctor profile not found');
    }

    return doctor.id;
  }

  private toFileResponse(file: typeof appointmentFiles.$inferSelect) {
    const { clinic_id: _cid, file_path: _fp, ...rest } = file;
    return {
      ...rest,
      downloadUrl: `/api/storage/files/${file.id}/download`,
    };
  }

  private validateFileContent(file: Express.Multer.File): void {
    const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
    const isPdf = file.mimetype === 'application/pdf';

    if (!isImage && !isPdf) {
      this.tryDeleteFile(file.path);
      throw new BadRequestException('Unsupported file type');
    }

    try {
      const fileBuffer = readFileSync(file.path);
      const header = fileBuffer.subarray(0, 12);

      if (isImage && !validateImageMagicBytes(header)) {
        this.tryDeleteFile(file.path);
        throw new BadRequestException('File content does not match declared type');
      }

      if (isPdf && !header.subarray(0, 4).equals(this.PDF_MAGIC_BYTES)) {
        this.tryDeleteFile(file.path);
        throw new BadRequestException('File content does not match declared type');
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.tryDeleteFile(file.path);
      throw new BadRequestException('Could not validate file');
    }
  }

  private tryDeleteFile(filePath: string): void {
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch {}
  }

  async saveAppointmentFile(
    appointmentId: string,
    clinicId: string,
    uploadedBy: string,
    file: Express.Multer.File,
  ) {
    this.validateFileContent(file);

    const [savedFile] = await this.db
      .insert(appointmentFiles)
      .values({
        appointment_id: appointmentId,
        clinic_id: clinicId,
        uploaded_by: uploadedBy,
        file_name: file.originalname,
        file_path: file.path,
        file_size: file.size,
        mime_type: file.mimetype,
      })
      .returning();

    return this.toFileResponse(savedFile);
  }

  async getFilesByAppointment(appointmentId: string, clinicId: string) {
    const files = await this.db
      .select()
      .from(appointmentFiles)
      .where(
        and(
          eq(appointmentFiles.appointment_id, appointmentId),
          eq(appointmentFiles.clinic_id, clinicId),
        ),
      );

    return files.map((f: typeof appointmentFiles.$inferSelect) =>
      this.toFileResponse(f),
    );
  }

  /** Internal use only — returns file_path for disk access */
  async getFileById(fileId: string, clinicId: string, userId?: string, role?: string) {
    const [file] = await this.db
      .select()
      .from(appointmentFiles)
      .where(
        and(eq(appointmentFiles.id, fileId), eq(appointmentFiles.clinic_id, clinicId)),
      )
      .limit(1);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.clinic_id !== clinicId) {
      throw new ForbiddenException('File does not belong to this clinic');
    }

    if (file.appointment_id && role === 'doctor' && userId) {
      const actualDoctorId = await this.getDoctorIdByUserId(userId, clinicId);
      const [appointment] = await this.db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.id, file.appointment_id),
            eq(appointments.clinic_id, clinicId),
          ),
        )
        .limit(1);

      if (!appointment) {
        throw new NotFoundException('File not found');
      }

      if (appointment.doctor_id !== actualDoctorId) {
        throw new ForbiddenException('You do not have access to this file');
      }
    }

    if (role === 'patient' && userId) {
      const [appointment] = await this.db
        .select()
        .from(appointments)
        .where(
          and(
            eq(appointments.id, file.appointment_id),
            eq(appointments.clinic_id, clinicId),
          ),
        )
        .limit(1);

      const [patient] = await this.db
        .select()
        .from(patients)
        .where(
          and(
            eq(patients.user_id, userId),
            eq(patients.clinic_id, clinicId),
          ),
        )
        .limit(1);

      if (!appointment || !patient || appointment.patient_id !== patient.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    return file;
  }

  async deleteFile(fileId: string, clinicId: string) {
    const file = await this.getFileById(fileId, clinicId);

    const [deletedFile] = await this.db
      .delete(appointmentFiles)
      .where(eq(appointmentFiles.id, fileId))
      .returning();

    try {
      if (existsSync(file.file_path)) {
        await unlink(file.file_path);
      }
    } catch {}

    return this.toFileResponse(deletedFile);
  }

  async saveAvatar(userId: string, file: Express.Multer.File) {
    this.validateFileContent(file);

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.avatar_url && existsSync(user.avatar_url)) {
      try {
        await unlink(user.avatar_url);
      } catch {}
    }

    await this.db
      .update(users)
      .set({
        avatar_url: file.path.replace('/app/uploads', '/uploads'),
        updated_at: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        role: users.role,
        clinic_id: users.clinic_id,
        is_active: users.is_active,
        google_id: users.google_id,
        avatar_url: users.avatar_url,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    return { avatarUrl: file.path.replace('/app/uploads', '/uploads') };
  }
}
