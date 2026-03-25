import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, ne } from 'drizzle-orm';
import {
  appointments,
  doctorAvailability,
  doctorAvailabilityOverrides,
} from '../database/schema';
import type { DoctorAvailability } from '../database/schema/doctor-availability.schema';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async getBookableSlots(
    clinicId: string,
    doctorId: string,
    date: string,
  ): Promise<string[]> {
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
    const availabilityBlocks = await this.db
      .select()
      .from(doctorAvailability)
      .where(
        and(
          eq(doctorAvailability.doctor_id, doctorId),
          eq(doctorAvailability.clinic_id, clinicId),
          eq(doctorAvailability.day_of_week, dayOfWeek),
          eq(doctorAvailability.is_active, true),
        ),
      );

    if (availabilityBlocks.length === 0) {
      return [];
    }

    const [override] = await this.db
      .select()
      .from(doctorAvailabilityOverrides)
      .where(
        and(
          eq(doctorAvailabilityOverrides.doctor_id, doctorId),
          eq(doctorAvailabilityOverrides.clinic_id, clinicId),
          eq(doctorAvailabilityOverrides.date, date),
        ),
      )
      .limit(1);

    if (override?.type === 'blackout') {
      return [];
    }

    const slotDuration = availabilityBlocks[0].slot_duration ?? 30;
    const rawSlots =
      override?.type === 'custom_hours'
        ? availabilityBlocks.flatMap((block: DoctorAvailability) => {
            const slots: string[] = [];

            if (
              override.start_time &&
              this.timeToMinutes(override.start_time) >
                this.timeToMinutes(block.start_time)
            ) {
              slots.push(
                ...this.generateSlots(
                  block.start_time,
                  override.start_time,
                  block.slot_duration ?? 30,
                ),
              );
            }

            if (
              override.end_time &&
              this.timeToMinutes(override.end_time) <
                this.timeToMinutes(block.end_time)
            ) {
              slots.push(
                ...this.generateSlots(
                  override.end_time,
                  block.end_time,
                  block.slot_duration ?? 30,
                ),
              );
            }

            return slots;
          })
        : availabilityBlocks.flatMap((block: DoctorAvailability) =>
            this.generateSlots(
              block.start_time,
              block.end_time,
              block.slot_duration ?? 30,
            ),
          );

    if (rawSlots.length === 0) {
      return [];
    }

    const existingAppointments = await this.db
      .select({
        start_time: appointments.start_time,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctor_id, doctorId),
          eq(appointments.clinic_id, clinicId),
          eq(appointments.appointment_date, date),
          ne(appointments.status, 'cancelled'),
        ),
      );

    const bookedStarts = new Set(
      existingAppointments.map((appointment: { start_time: string }) =>
        appointment.start_time.slice(0, 5),
      ),
    );

    return rawSlots.filter((slot: string) => !bookedStarts.has(slot));
  }

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

  private generateSlots(
    startTime: string,
    endTime: string,
    slotDuration: number,
  ): string[] {
    const slots: string[] = [];
    let currentMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    while (currentMinutes < endMinutes) {
      slots.push(this.minutesToTime(currentMinutes));
      currentMinutes += slotDuration;
    }

    return slots;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(totalMinutes: number): string {
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
