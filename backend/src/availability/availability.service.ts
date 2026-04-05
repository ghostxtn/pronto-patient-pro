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

    const overrides = await this.db
      .select()
      .from(doctorAvailabilityOverrides)
      .where(
        and(
          eq(doctorAvailabilityOverrides.doctor_id, doctorId),
          eq(doctorAvailabilityOverrides.clinic_id, clinicId),
          eq(doctorAvailabilityOverrides.date, date),
        ),
      );

    const blackoutOverride = overrides.find(
      (override: { type: string }) => override.type === 'blackout',
    );

    if (blackoutOverride) {
      return [];
    }

    const customHoursOverride = overrides.find(
      (override: {
        type: string;
        start_time: string | null;
        end_time: string | null;
      }) =>
        override.type === 'custom_hours' &&
        override.start_time &&
        override.end_time,
    );

    const rawSlots = availabilityBlocks.flatMap((block: DoctorAvailability) => {
      let segments = [
        {
          start: this.timeToMinutes(block.start_time),
          end: this.timeToMinutes(block.end_time),
        },
      ];

      if (customHoursOverride) {
        segments = this.subtractBlockedRange(
          segments,
          this.timeToMinutes(customHoursOverride.start_time as string),
          this.timeToMinutes(customHoursOverride.end_time as string),
        );
      }

      return segments.flatMap((segment) => {
        if (segment.end <= segment.start) {
          return [];
        }

        return this.generateSlotEntries(
          this.minutesToTime(segment.start),
          this.minutesToTime(segment.end),
          block.slot_duration ?? 30,
        );
      });
    });

    if (rawSlots.length === 0) {
      return [];
    }

    const existingAppointments = await this.db
      .select({
        start_time: appointments.start_time,
        end_time: appointments.end_time,
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

    return rawSlots
      .filter((slot: { startTime: string; duration: number }) => {
        const slotStartMinutes = this.timeToMinutes(slot.startTime);
        const slotEndMinutes = slotStartMinutes + slot.duration;

        return !existingAppointments.some(
          (appointment: { start_time: string; end_time: string }) => {
            const appointmentStartMinutes = this.timeToMinutes(
              appointment.start_time,
            );
            const appointmentEndMinutes = this.timeToMinutes(
              appointment.end_time,
            );

            return (
              appointmentStartMinutes < slotEndMinutes &&
              appointmentEndMinutes > slotStartMinutes
            );
          },
        );
      })
      .map((slot: { startTime: string }) => slot.startTime);
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

    const candidateRange = {
      start: this.timeToMinutes(dto.startTime),
      end: this.timeToMinutes(dto.endTime),
    };

    const hasOverlap = existing.some((slot: DoctorAvailability) => {
      const existingRange = {
        start: this.timeToMinutes(slot.start_time),
        end: this.timeToMinutes(slot.end_time),
      };
      return this.rangesOverlap(candidateRange, existingRange);
    });

    if (hasOverlap) {
      throw new ConflictException(
        'Bu gun ve saat araliginda zaten aktif bir musaitlik slotu mevcut.',
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
    const nextStartTime =
      dto.startTime ?? currentAvailability.start_time.slice(0, 5);
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
            ne(doctorAvailability.id, id),
          ),
        );

      const candidateRange = {
        start: this.timeToMinutes(nextStartTime),
        end: this.timeToMinutes(nextEndTime),
      };

      const hasOverlap = existing.some((slot: DoctorAvailability) => {
        const existingRange = {
          start: this.timeToMinutes(slot.start_time),
          end: this.timeToMinutes(slot.end_time),
        };
        return this.rangesOverlap(candidateRange, existingRange);
      });

      if (hasOverlap) {
        throw new ConflictException(
          'Bu gun ve saat araliginda zaten aktif bir musaitlik slotu mevcut.',
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

  private generateSlotEntries(
    startTime: string,
    endTime: string,
    slotDuration: number,
  ): Array<{ startTime: string; duration: number }> {
    return this.generateSlots(startTime, endTime, slotDuration).map((slot) => ({
      startTime: slot,
      duration: slotDuration,
    }));
  }

  private subtractBlockedRange(
    segments: Array<{ start: number; end: number }>,
    blockedStart: number,
    blockedEnd: number,
  ) {
    return segments.flatMap((segment) => {
      if (blockedEnd <= segment.start || blockedStart >= segment.end) {
        return [segment];
      }

      const nextSegments: Array<{ start: number; end: number }> = [];

      if (blockedStart > segment.start) {
        nextSegments.push({
          start: segment.start,
          end: blockedStart,
        });
      }

      if (blockedEnd < segment.end) {
        nextSegments.push({
          start: blockedEnd,
          end: segment.end,
        });
      }

      return nextSegments;
    });
  }

  private rangesOverlap(
    left: { start: number; end: number },
    right: { start: number; end: number },
  ) {
    return left.start < right.end && right.start < left.end;
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

