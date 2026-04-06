import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import {
  doctorAvailabilityOverrides,
  doctors,
} from '../database/schema';
import {
  createUnionRange,
  minutesToTime,
  rangesOverlap,
  timeToMinutes,
  type MinuteRange,
} from '../availability/calendar-time.utils';
import { CreateAvailabilityOverrideDto } from './dto/create-availability-override.dto';
import { UpdateAvailabilityOverrideDto } from './dto/update-availability-override.dto';

type CustomHoursOverride = {
  id: string;
  type: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
};

@Injectable()
export class AvailabilityOverridesService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async listByDoctor(doctorId: string, clinicId: string) {
    await this.ensureDoctorInClinic(doctorId, clinicId);

    return this.db
      .select()
      .from(doctorAvailabilityOverrides)
      .where(
        and(
          eq(doctorAvailabilityOverrides.doctor_id, doctorId),
          eq(doctorAvailabilityOverrides.clinic_id, clinicId),
        ),
      );
  }

  async listByDateRange(
    doctorId: string,
    clinicId: string,
    dateFrom: string,
    dateTo: string,
  ) {
    await this.ensureDoctorInClinic(doctorId, clinicId);

    return this.db
      .select()
      .from(doctorAvailabilityOverrides)
      .where(
        and(
          eq(doctorAvailabilityOverrides.doctor_id, doctorId),
          eq(doctorAvailabilityOverrides.clinic_id, clinicId),
          gte(doctorAvailabilityOverrides.date, dateFrom),
          lte(doctorAvailabilityOverrides.date, dateTo),
        ),
      );
  }

  async create(dto: CreateAvailabilityOverrideDto, clinicId: string) {
    await this.ensureDoctorInClinic(dto.doctor_id, clinicId);
    this.validateOverridePayload(dto);

    const sameDayOverrides = await this.findOverridesForDate(
      dto.doctor_id,
      clinicId,
      dto.date,
    );
    this.ensureOverrideCompatibility(sameDayOverrides, dto.type);

    const overlappingCustomHours = this.findOverlappingCustomHours(
      sameDayOverrides,
      dto.type,
      dto.start_time,
      dto.end_time,
    );

    if (dto.type !== 'custom_hours' || overlappingCustomHours.length === 0) {
      const [override] = await this.db
        .insert(doctorAvailabilityOverrides)
        .values({
          clinic_id: clinicId,
          doctor_id: dto.doctor_id,
          date: dto.date,
          type: dto.type,
          start_time: dto.start_time ?? null,
          end_time: dto.end_time ?? null,
          reason: dto.reason ?? null,
        })
        .returning();

      return override;
    }

    return this.normalizeCustomHoursOverlap({
      keeperId: overlappingCustomHours[0].id,
      doctorId: dto.doctor_id,
      clinicId,
      date: dto.date,
      reason: dto.reason ?? overlappingCustomHours[0].reason ?? null,
      startTime: dto.start_time as string,
      endTime: dto.end_time as string,
      overlappingOverrides: overlappingCustomHours,
    });
  }

  async update(id: string, dto: UpdateAvailabilityOverrideDto, clinicId: string) {
    const existing = await this.findById(id, clinicId);
    const nextDoctorId = dto.doctor_id ?? existing.doctor_id;
    const nextDate = dto.date ?? existing.date;
    const nextType = dto.type ?? existing.type;
    const nextStartTime =
      dto.start_time !== undefined ? dto.start_time : existing.start_time;
    const nextEndTime =
      dto.end_time !== undefined ? dto.end_time : existing.end_time;
    const nextReason =
      dto.reason !== undefined ? dto.reason : existing.reason ?? null;

    await this.ensureDoctorInClinic(nextDoctorId, clinicId);
    this.validateOverridePayload({
      type: nextType,
      start_time: nextStartTime ?? undefined,
      end_time: nextEndTime ?? undefined,
    });

    const comparableOverrides = (await this.findOverridesForDate(
      nextDoctorId,
      clinicId,
      nextDate,
    )).filter((override: { id: string }) => override.id !== id);
    this.ensureOverrideCompatibility(comparableOverrides, nextType);

    const overlappingCustomHours = this.findOverlappingCustomHours(
      comparableOverrides,
      nextType,
      nextStartTime ?? undefined,
      nextEndTime ?? undefined,
    );

    if (nextType === 'custom_hours' && overlappingCustomHours.length > 0) {
      return this.normalizeCustomHoursOverlap({
        keeperId: id,
        doctorId: nextDoctorId,
        clinicId,
        date: nextDate,
        reason: nextReason,
        startTime: nextStartTime as string,
        endTime: nextEndTime as string,
        overlappingOverrides: overlappingCustomHours,
      });
    }

    const [override] = await this.db
      .update(doctorAvailabilityOverrides)
      .set({
        doctor_id: nextDoctorId,
        date: nextDate,
        type: nextType,
        start_time: nextType === 'blackout' ? null : nextStartTime,
        end_time: nextType === 'blackout' ? null : nextEndTime,
        reason: nextReason,
        updated_at: new Date(),
      })
      .where(eq(doctorAvailabilityOverrides.id, id))
      .returning();

    return override;
  }

  async remove(id: string, clinicId: string) {
    await this.findById(id, clinicId);

    const [override] = await this.db
      .delete(doctorAvailabilityOverrides)
      .where(eq(doctorAvailabilityOverrides.id, id))
      .returning();

    return override;
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

  private async findById(id: string, clinicId: string) {
    const [override] = await this.db
      .select()
      .from(doctorAvailabilityOverrides)
      .where(
        and(
          eq(doctorAvailabilityOverrides.id, id),
          eq(doctorAvailabilityOverrides.clinic_id, clinicId),
        ),
      )
      .limit(1);

    if (!override) {
      throw new NotFoundException('Availability override not found');
    }

    return override;
  }

  private async findOverridesForDate(
    doctorId: string,
    clinicId: string,
    date: string,
  ) {
    return this.db
      .select()
      .from(doctorAvailabilityOverrides)
      .where(
        and(
          eq(doctorAvailabilityOverrides.doctor_id, doctorId),
          eq(doctorAvailabilityOverrides.clinic_id, clinicId),
          eq(doctorAvailabilityOverrides.date, date),
        ),
      );
  }

  private validateOverridePayload(dto: {
    type: string;
    start_time?: string;
    end_time?: string;
  }) {
    if (dto.type === 'custom_hours') {
      if (!dto.start_time || !dto.end_time) {
        throw new BadRequestException(
          'start_time and end_time are required for custom_hours',
        );
      }

      if (dto.start_time >= dto.end_time) {
        throw new BadRequestException(
          'start_time must be before end_time for custom_hours',
        );
      }
    }

    if (dto.type === 'blackout') {
      if (dto.start_time || dto.end_time) {
        throw new BadRequestException(
          'start_time and end_time are not allowed for blackout',
        );
      }
    }
  }

  private ensureOverrideCompatibility(
    comparableOverrides: Array<{
      type: string;
    }>,
    nextType: string,
  ) {
    if (nextType === 'blackout' && comparableOverrides.length > 0) {
      throw new ConflictException('Blackout cannot coexist with other overrides');
    }

    if (nextType !== 'custom_hours') {
      return;
    }

    const blackoutOverride = comparableOverrides.find(
      (override: { type: string }) => override.type === 'blackout',
    );

    if (blackoutOverride) {
      throw new ConflictException('Custom hours cannot coexist with blackout');
    }
  }

  private findOverlappingCustomHours(
    comparableOverrides: CustomHoursOverride[],
    nextType: string,
    startTime?: string,
    endTime?: string,
  ) {
    if (nextType !== 'custom_hours' || !startTime || !endTime) {
      return [];
    }

    const nextRange = this.toRange(startTime, endTime);

    return comparableOverrides.filter(
      (override) =>
        override.type === 'custom_hours' &&
        override.start_time &&
        override.end_time &&
        rangesOverlap(nextRange, this.toRange(override.start_time, override.end_time)),
    );
  }

  private async normalizeCustomHoursOverlap(params: {
    keeperId: string;
    doctorId: string;
    clinicId: string;
    date: string;
    reason: string | null;
    startTime: string;
    endTime: string;
    overlappingOverrides: CustomHoursOverride[];
  }) {
    const overlappingRanges = params.overlappingOverrides
      .filter(
        (override) => override.start_time && override.end_time,
      )
      .map((override) =>
        this.toRange(override.start_time as string, override.end_time as string),
      );
    const mergedRange = createUnionRange([
      this.toRange(params.startTime, params.endTime),
      ...overlappingRanges,
    ]);
    const redundantIds = params.overlappingOverrides
      .map((override) => override.id)
      .filter((overrideId) => overrideId !== params.keeperId);

    return this.db.transaction(async (tx: any) => {
      const [override] = await tx
        .update(doctorAvailabilityOverrides)
        .set({
          clinic_id: params.clinicId,
          doctor_id: params.doctorId,
          date: params.date,
          type: 'custom_hours',
          start_time: minutesToTime(mergedRange.start),
          end_time: minutesToTime(mergedRange.end),
          reason: params.reason,
          updated_at: new Date(),
        })
        .where(eq(doctorAvailabilityOverrides.id, params.keeperId))
        .returning();

      if (redundantIds.length > 0) {
        await tx
          .delete(doctorAvailabilityOverrides)
          .where(inArray(doctorAvailabilityOverrides.id, redundantIds));
      }

      return override;
    });
  }

  private toRange(startTime: string, endTime: string): MinuteRange {
    return {
      start: timeToMinutes(startTime),
      end: timeToMinutes(endTime),
    };
  }
}
