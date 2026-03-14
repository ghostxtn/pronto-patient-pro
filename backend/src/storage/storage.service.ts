import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { existsSync } from 'fs';
import { unlink } from 'fs/promises';
import { and, eq } from 'drizzle-orm';
import { appointmentFiles, users } from '../database/schema';

@Injectable()
export class StorageService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async saveAppointmentFile(
    appointmentId: string,
    clinicId: string,
    uploadedBy: string,
    file: Express.Multer.File,
  ) {
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

    return savedFile;
  }

  async getFilesByAppointment(appointmentId: string, clinicId: string) {
    return this.db
      .select()
      .from(appointmentFiles)
      .where(
        and(
          eq(appointmentFiles.appointment_id, appointmentId),
          eq(appointmentFiles.clinic_id, clinicId),
        ),
      );
  }

  async getFileById(fileId: string, clinicId: string) {
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

    return deletedFile;
  }

  async saveAvatar(userId: string, file: Express.Multer.File) {
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
