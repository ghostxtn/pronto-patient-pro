import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, ne } from 'drizzle-orm';
import {
  appointments,
  doctorAvailability,
  doctorAvailabilityOverrides,
  doctors,
} from '../database/schema';
import type { DoctorAvailability } from '../database/schema/doctor-availability.schema';
import {
  createUnionRange,
  isExpiredStartTime,
  mergeRanges,
  minutesToTime,
  rangesOverlap,
  timeToMinutes,
  type MinuteRange,
  type SlotEntry,
} from './calendar-time.utils';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

type AvailabilityContext = {
  availabilityRanges: MinuteRange[];
  slotEntries: SlotEntry[];
};

@Injectable()
export class AvailabilityService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async getBookableSlots(
    clinicId: string,
    doctorId: string,
    date: string,
  ): Promise<string[]> {
    const slotEntries = await this.getBookableSlotEntries(clinicId, doctorId, date);
    return slotEntries.map((slotEntry) => slotEntry.startTime);
  }

  async create(dto: CreateAvailabilityDto, clinicId: string) {
    await this.ensureDoctorInClinic(dto.doctorId, clinicId);
    this.validateAvailabilityRange(dto.startTime, dto.endTime);

    const candidateRange = this.toRange(dto.startTime, dto.endTime);
    const overlappingSlots = await this.findOverlappingActiveSlots({
      clinicId,
      doctorId: dto.doctorId,
      dayOfWeek: dto.dayOfWeek,
      range: candidateRange,
    });
    const slotDuration = this.resolveNormalizedSlotDuration(
      dto.slotDuration ?? 30,
      overlappingSlots,
    );

    if (overlappingSlots.length === 0) {
      const [availability] = await this.db
        .insert(doctorAvailability)
        .values({
          doctor_id: dto.doctorId,
          clinic_id: clinicId,
          day_of_week: dto.dayOfWeek,
          start_time: dto.startTime,
          end_time: dto.endTime,
          slot_duration: slotDuration,
        })
        .returning();

      return availability;
    }

    return this.normalizeAvailabilityOverlap({
      keeperId: overlappingSlots[0].id,
      dayOfWeek: dto.dayOfWeek,
      slotDuration,
      candidateRange,
      overlappingSlots,
    });
  }

  async findByDoctor(doctorId: string, clinicId: string) {
    await this.ensureDoctorInClinic(doctorId, clinicId);

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
    await this.ensureDoctorInClinic(currentAvailability.doctor_id, clinicId);

    const nextDayOfWeek = dto.dayOfWeek ?? currentAvailability.day_of_week;
    const nextStartTime =
      dto.startTime ?? currentAvailability.start_time.slice(0, 5);
    const nextEndTime = dto.endTime ?? currentAvailability.end_time.slice(0, 5);
    const nextIsActive = dto.isActive ?? currentAvailability.is_active;
    const nextSlotDuration =
      dto.slotDuration ?? currentAvailability.slot_duration ?? 30;

    this.validateAvailabilityRange(nextStartTime, nextEndTime);

    if (!nextIsActive) {
      return this.updateAvailabilityRecord(id, dto);
    }

    const candidateRange = this.toRange(nextStartTime, nextEndTime);
    const overlappingSlots = await this.findOverlappingActiveSlots({
      clinicId,
      doctorId: currentAvailability.doctor_id,
      dayOfWeek: nextDayOfWeek,
      range: candidateRange,
      excludeId: id,
    });
    const slotDuration = this.resolveNormalizedSlotDuration(
      nextSlotDuration,
      overlappingSlots,
    );

    if (overlappingSlots.length === 0) {
      return this.updateAvailabilityRecord(id, dto);
    }

    return this.normalizeAvailabilityOverlap({
      keeperId: id,
      dayOfWeek: nextDayOfWeek,
      slotDuration,
      candidateRange,
      overlappingSlots,
    });
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

  async getAvailabilityContext(
    clinicId: string,
    doctorId: string,
    date: string,
    options: {
      excludeExpired?: boolean;
    } = {},
  ): Promise<AvailabilityContext> {
    await this.ensureDoctorInClinic(doctorId, clinicId);

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
      return {
        availabilityRanges: [],
        slotEntries: [],
      };
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

    if (overrides.some((override: { type: string }) => override.type === 'blackout')) {
      return {
        availabilityRanges: [],
        slotEntries: [],
      };
    }

    const blockedRanges = overrides
      .filter(
        (override: {
          type: string;
          start_time: string | null;
          end_time: string | null;
        }) =>
          override.type === 'custom_hours' &&
          override.start_time &&
          override.end_time,
      )
      .map((override: { start_time: string; end_time: string }) =>
        this.toRange(override.start_time, override.end_time),
      );

    const rawAvailabilityRanges: MinuteRange[] = [];
    const rawSlotEntries: SlotEntry[] = [];

    for (const block of availabilityBlocks as DoctorAvailability[]) {
      let segments = [this.toRange(block.start_time, block.end_time)];

      for (const blockedRange of blockedRanges) {
        segments = this.subtractBlockedRange(
          segments,
          blockedRange.start,
          blockedRange.end,
        );
      }

      for (const segment of segments) {
        if (segment.end <= segment.start) {
          continue;
        }

        rawAvailabilityRanges.push(segment);
        rawSlotEntries.push(
          ...this.generateSlotEntries(segment.start, segment.end, block.slot_duration ?? 30),
        );
      }
    }

    return {
      availabilityRanges: mergeRanges(rawAvailabilityRanges, {
        mergeTouching: true,
      }),
      slotEntries: this.dedupeSlotEntries(
        rawSlotEntries.filter(
          (slotEntry) =>
            options.excludeExpired !== true ||
            !isExpiredStartTime(date, slotEntry.startTime),
        ),
      ),
    };
  }

  private async getBookableSlotEntries(
    clinicId: string,
    doctorId: string,
    date: string,
  ): Promise<SlotEntry[]> {
    const availabilityContext = await this.getAvailabilityContext(
      clinicId,
      doctorId,
      date,
      {
        excludeExpired: true,
      },
    );

    if (availabilityContext.slotEntries.length === 0) {
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

    return this.dedupeSlotEntries(
      availabilityContext.slotEntries.filter((slotEntry) => {
        const slotRange = {
          start: slotEntry.startMinutes,
          end: slotEntry.endMinutes,
        };

        return !existingAppointments.some(
          (appointment: { start_time: string; end_time: string }) =>
            rangesOverlap(slotRange, this.toRange(appointment.start_time, appointment.end_time)),
        );
      }),
    );
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

  private validateAvailabilityRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new ConflictException(
        'Availability end time must be after start time.',
      );
    }
  }

  private async findOverlappingActiveSlots(params: {
    clinicId: string;
    doctorId: string;
    dayOfWeek: number;
    range: MinuteRange;
    excludeId?: string;
  }) {
    const conditions = [
      eq(doctorAvailability.doctor_id, params.doctorId),
      eq(doctorAvailability.clinic_id, params.clinicId),
      eq(doctorAvailability.day_of_week, params.dayOfWeek),
      eq(doctorAvailability.is_active, true),
    ];

    if (params.excludeId) {
      conditions.push(ne(doctorAvailability.id, params.excludeId));
    }

    const existingSlots = await this.db
      .select()
      .from(doctorAvailability)
      .where(and(...conditions));

    return (existingSlots as DoctorAvailability[]).filter((slot) =>
      rangesOverlap(params.range, this.toRange(slot.start_time, slot.end_time)),
    );
  }

  private resolveNormalizedSlotDuration(
    candidateSlotDuration: number,
    overlappingSlots: DoctorAvailability[],
  ) {
    const durationSet = new Set([
      candidateSlotDuration,
      ...overlappingSlots.map((slot) => slot.slot_duration ?? 30),
    ]);

    if (durationSet.size > 1) {
      throw new ConflictException(
        'Overlapping availability slots with different slot durations cannot be normalized automatically.',
      );
    }

    return candidateSlotDuration;
  }

  private async normalizeAvailabilityOverlap(params: {
    keeperId: string;
    dayOfWeek: number;
    slotDuration: number;
    candidateRange: MinuteRange;
    overlappingSlots: DoctorAvailability[];
  }) {
    const mergedRange = createUnionRange([
      params.candidateRange,
      ...params.overlappingSlots.map((slot) =>
        this.toRange(slot.start_time, slot.end_time),
      ),
    ]);
    const redundantIds = params.overlappingSlots
      .map((slot) => slot.id)
      .filter((slotId) => slotId !== params.keeperId);

    return this.db.transaction(async (tx: any) => {
      const [availability] = await tx
        .update(doctorAvailability)
        .set({
          day_of_week: params.dayOfWeek,
          start_time: minutesToTime(mergedRange.start),
          end_time: minutesToTime(mergedRange.end),
          slot_duration: params.slotDuration,
          is_active: true,
          updated_at: new Date(),
        })
        .where(eq(doctorAvailability.id, params.keeperId))
        .returning();

      if (redundantIds.length > 0) {
        await tx
          .delete(doctorAvailability)
          .where(inArray(doctorAvailability.id, redundantIds));
      }

      return availability;
    });
  }

  private updateAvailabilityRecord(id: string, dto: UpdateAvailabilityDto) {
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

    return this.db
      .update(doctorAvailability)
      .set(updateData)
      .where(eq(doctorAvailability.id, id))
      .returning()
      .then((rows: DoctorAvailability[]) => rows[0]);
  }

  private generateSlots(
    startMinutes: number,
    endMinutes: number,
    slotDuration: number,
  ): string[] {
    const slots: string[] = [];
    let currentMinutes = startMinutes;

    while (currentMinutes < endMinutes) {
      slots.push(minutesToTime(currentMinutes));
      currentMinutes += slotDuration;
    }

    return slots;
  }

  private generateSlotEntries(
    startMinutes: number,
    endMinutes: number,
    slotDuration: number,
  ): SlotEntry[] {
    return this.generateSlots(startMinutes, endMinutes, slotDuration).map(
      (slot) => {
        const slotStartMinutes = timeToMinutes(slot);
        return {
          startTime: slot,
          endTime: minutesToTime(slotStartMinutes + slotDuration),
          duration: slotDuration,
          startMinutes: slotStartMinutes,
          endMinutes: slotStartMinutes + slotDuration,
        };
      },
    );
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

  private dedupeSlotEntries(slotEntries: SlotEntry[]) {
    const entriesByStartTime = new Map<string, SlotEntry>();

    for (const slotEntry of slotEntries) {
      const currentEntry = entriesByStartTime.get(slotEntry.startTime);

      if (!currentEntry || slotEntry.endMinutes > currentEntry.endMinutes) {
        entriesByStartTime.set(slotEntry.startTime, slotEntry);
      }
    }

    return [...entriesByStartTime.values()].sort(
      (left, right) => left.startMinutes - right.startMinutes,
    );
  }

  private toRange(startTime: string, endTime: string): MinuteRange {
    return {
      start: timeToMinutes(startTime),
      end: timeToMinutes(endTime),
    };
  }
}
