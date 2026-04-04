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
  doctors,
} from '../database/schema';
import type { DoctorAvailability } from '../database/schema/doctor-availability.schema';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

export interface BookableSlot {
  startTime: string;
  endTime: string;
  slotDuration: number;
}

const CLINIC_TIME_ZONE = 'Europe/Istanbul';

@Injectable()
export class AvailabilityService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async getBookableSlots(
    clinicId: string,
    doctorId: string,
    date: string,
  ): Promise<string[]> {
    const slotDetails = await this.getBookableSlotDetails(clinicId, doctorId, date);
    return slotDetails.map((slot) => slot.startTime);
  }

  async getBookableSlotDetails(
    clinicId: string,
    doctorId: string,
    date: string,
  ): Promise<BookableSlot[]> {
    const clinicNow = this.getClinicNowParts();

    if (date < clinicNow.date) {
      return [];
    }

    const [doctor] = await this.db
      .select({
        id: doctors.id,
        is_active: doctors.is_active,
      })
      .from(doctors)
      .where(
        and(
          eq(doctors.id, doctorId),
          eq(doctors.clinic_id, clinicId),
        ),
      )
      .limit(1);

    if (!doctor?.is_active) {
      return [];
    }

    const dayOfWeek = this.getDayOfWeek(date);
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
      if (!override.start_time || !override.end_time) {
        return [];
      }
    }

    const fallbackSlotDuration =
      availabilityBlocks[0]?.slot_duration ?? 30;

    if (availabilityBlocks.length === 0 && override?.type !== 'custom_hours') {
      return [];
    }

    const rawSlots =
      override?.type === 'custom_hours' && override.start_time && override.end_time
        ? this.generateSlotsWithDetails(
            override.start_time,
            override.end_time,
            fallbackSlotDuration,
          )
        : availabilityBlocks.flatMap((block: DoctorAvailability) =>
            this.generateSlotsWithDetails(
              block.start_time,
              block.end_time,
              block.slot_duration ?? fallbackSlotDuration,
            ),
          );

    if (rawSlots.length === 0) {
      return [];
    }

    const filteredSlots =
      override?.type === 'blackout' && override.start_time && override.end_time
        ? rawSlots.filter((slot: BookableSlot) => {
            return (
              this.timeToMinutes(slot.endTime) <=
                this.timeToMinutes(override.start_time) ||
              this.timeToMinutes(slot.startTime) >=
                this.timeToMinutes(override.end_time)
            );
          })
        : rawSlots;

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

    return filteredSlots
      .filter((slot: BookableSlot) => !bookedStarts.has(slot.startTime))
      .filter((slot: BookableSlot) => {
        if (date !== clinicNow.date) {
          return true;
        }

        return this.timeToMinutes(slot.startTime) > clinicNow.minutes;
      })
      .sort(
        (left: BookableSlot, right: BookableSlot) =>
          this.timeToMinutes(left.startTime) - this.timeToMinutes(right.startTime),
      );
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
    return this.generateSlotsWithDetails(startTime, endTime, slotDuration).map(
      (slot) => slot.startTime,
    );
  }

  private generateSlotsWithDetails(
    startTime: string,
    endTime: string,
    slotDuration: number,
  ): BookableSlot[] {
    const slots: BookableSlot[] = [];
    let currentMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    while (currentMinutes < endMinutes) {
      const slotStart = this.minutesToTime(currentMinutes);
      const slotEnd = this.minutesToTime(currentMinutes + slotDuration);

      if (this.timeToMinutes(slotEnd) > endMinutes) {
        break;
      }

      slots.push({
        startTime: slotStart,
        endTime: slotEnd,
        slotDuration,
      });
      currentMinutes += slotDuration;
    }

    return slots;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getDayOfWeek(date: string): number {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  }

  private getClinicNowParts(): { date: string; minutes: number } {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: CLINIC_TIME_ZONE,
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

  private minutesToTime(totalMinutes: number): string {
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
