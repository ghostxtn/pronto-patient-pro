import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { doctorAvailability } from '../database/schema';
import type { DoctorAvailability } from '../database/schema/doctor-availability.schema';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async create(dto: CreateAvailabilityDto, clinicId: string) {
    const existing = await this.db
      .select()
      .from(doctorAvailability)
      .where(
        and(
          eq(doctorAvailability.doctor_id, dto.doctorId),
          eq(doctorAvailability.clinic_id, clinicId),
          eq(doctorAvailability.day_of_week, dto.dayOfWeek),
          eq(doctorAvailability.is_active, true),
        ),
      );

    const newStart = dto.startTime;
    const newEnd = dto.endTime;

    const hasOverlap = existing.some((slot: DoctorAvailability) => {
      const existStart = slot.start_time.slice(0, 5);
      const existEnd = slot.end_time.slice(0, 5);
      return newStart < existEnd && newEnd > existStart;
    });

    if (hasOverlap) {
      throw new ConflictException(
        'Bu gün ve saat aralığında zaten aktif bir müsaitlik slotu mevcut.',
      );
    }

    const [availability] = await this.db
      .insert(doctorAvailability)
      .values({
        doctor_id: dto.doctorId,
        clinic_id: clinicId,
        day_of_week: dto.dayOfWeek,
        start_time: dto.startTime,
        end_time: dto.endTime,
        slot_duration: dto.slotDuration ?? 30,
      })
      .returning();

    return availability;
  }

  async findByDoctor(doctorId: string, clinicId: string) {
    return this.db
      .select()
      .from(doctorAvailability)
      .where(
        and(
          eq(doctorAvailability.doctor_id, doctorId),
          eq(doctorAvailability.clinic_id, clinicId),
        ),
      );
  }

  async findById(id: string, clinicId: string) {
    const [availability] = await this.db
      .select()
      .from(doctorAvailability)
      .where(
        and(
          eq(doctorAvailability.id, id),
          eq(doctorAvailability.clinic_id, clinicId),
        ),
      )
      .limit(1);

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    return availability;
  }

  async update(id: string, dto: UpdateAvailabilityDto, clinicId: string) {
    const currentAvailability = await this.findById(id, clinicId);

    const nextDayOfWeek = dto.dayOfWeek ?? currentAvailability.day_of_week;
    const nextStartTime = dto.startTime ?? currentAvailability.start_time.slice(0, 5);
    const nextEndTime = dto.endTime ?? currentAvailability.end_time.slice(0, 5);
    const nextIsActive = dto.isActive ?? currentAvailability.is_active;

    if (nextIsActive) {
      const existing = await this.db
        .select()
        .from(doctorAvailability)
        .where(
          and(
            eq(doctorAvailability.doctor_id, currentAvailability.doctor_id),
            eq(doctorAvailability.clinic_id, clinicId),
            eq(doctorAvailability.day_of_week, nextDayOfWeek),
            eq(doctorAvailability.is_active, true),
          ),
        );

      const hasOverlap = existing
        .filter((slot: DoctorAvailability) => slot.id !== id)
        .some((slot: DoctorAvailability) => {
          const existStart = slot.start_time.slice(0, 5);
          const existEnd = slot.end_time.slice(0, 5);
          return nextStartTime < existEnd && nextEndTime > existStart;
        });

      if (hasOverlap) {
        throw new ConflictException(
          'Bu gün ve saat aralığında zaten aktif bir müsaitlik slotu mevcut.',
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (dto.dayOfWeek !== undefined) {
      updateData.day_of_week = dto.dayOfWeek;
    }

    if (dto.startTime !== undefined) {
      updateData.start_time = dto.startTime;
    }

    if (dto.endTime !== undefined) {
      updateData.end_time = dto.endTime;
    }

    if (dto.slotDuration !== undefined) {
      updateData.slot_duration = dto.slotDuration;
    }

    if (dto.isActive !== undefined) {
      updateData.is_active = dto.isActive;
    }

    const [availability] = await this.db
      .update(doctorAvailability)
      .set(updateData)
      .where(eq(doctorAvailability.id, id))
      .returning();

    return availability;
  }

  async remove(id: string, clinicId: string) {
    await this.findById(id, clinicId);

    await this.db
      .delete(doctorAvailability)
      .where(
        and(
          eq(doctorAvailability.id, id),
          eq(doctorAvailability.clinic_id, clinicId),
        ),
      );

    return { success: true };
  }
}
