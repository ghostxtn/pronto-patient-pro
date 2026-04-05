import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, lte } from 'drizzle-orm';
import {
  appointments,
  doctorAvailabilityOverrides,
  doctors,
} from '../database/schema';
import { CreateAvailabilityOverrideDto } from './dto/create-availability-override.dto';
import { UpdateAvailabilityOverrideDto } from './dto/update-availability-override.dto';

type OverrideRecord = typeof doctorAvailabilityOverrides.$inferSelect;

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

    if (dto.type === 'blackout') {
      await this.ensureSingleBlackout(dto.doctor_id, dto.date, clinicId);
      const [override] = await this.db
        .insert(doctorAvailabilityOverrides)
        .values({
          clinic_id: clinicId,
          doctor_id: dto.doctor_id,
          date: dto.date,
          type: dto.type,
          start_time: null,
          end_time: null,
          reason: dto.reason ?? null,
        })
        .returning();

      return override;
    }

    const mergePlan = await this.buildCustomHoursMergePlan({
      clinicId,
      doctorId: dto.doctor_id,
      date: dto.date,
      startTime: dto.start_time!,
      endTime: dto.end_time!,
      reason: dto.reason,
      currentId: null,
    });

    if (mergePlan.mergedOverride) {
      const [override] = await this.db
        .update(doctorAvailabilityOverrides)
        .set({
          start_time: mergePlan.mergedOverride.startTime,
          end_time: mergePlan.mergedOverride.endTime,
          reason: mergePlan.mergedOverride.reason ?? null,
          updated_at: new Date(),
        })
        .where(eq(doctorAvailabilityOverrides.id, mergePlan.mergedOverride.keepId))
        .returning();

      for (const deleteId of mergePlan.mergedOverride.deleteIds) {
        await this.db
          .delete(doctorAvailabilityOverrides)
          .where(eq(doctorAvailabilityOverrides.id, deleteId));
      }

      return override;
    }

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
      dto.reason !== undefined ? dto.reason : existing.reason ?? undefined;

    await this.ensureDoctorInClinic(nextDoctorId, clinicId);
    this.validateOverridePayload({
      type: nextType,
      start_time: nextStartTime ?? undefined,
      end_time: nextEndTime ?? undefined,
    });

    if (nextType === 'blackout') {
      await this.ensureSingleBlackout(nextDoctorId, nextDate, clinicId, id);
      const [override] = await this.db
        .update(doctorAvailabilityOverrides)
        .set({
          doctor_id: nextDoctorId,
          date: nextDate,
          type: nextType,
          start_time: null,
          end_time: null,
          reason: nextReason ?? null,
          updated_at: new Date(),
        })
        .where(eq(doctorAvailabilityOverrides.id, id))
        .returning();

      return override;
    }

    const mergePlan = await this.buildCustomHoursMergePlan({
      clinicId,
      doctorId: nextDoctorId,
      date: nextDate,
      startTime: nextStartTime!,
      endTime: nextEndTime!,
      reason: nextReason,
      currentId: id,
    });

    if (mergePlan.mergedOverride) {
      const [override] = await this.db
        .update(doctorAvailabilityOverrides)
        .set({
          doctor_id: nextDoctorId,
          date: nextDate,
          type: nextType,
          start_time: mergePlan.mergedOverride.startTime,
          end_time: mergePlan.mergedOverride.endTime,
          reason: mergePlan.mergedOverride.reason ?? null,
          updated_at: new Date(),
        })
        .where(eq(doctorAvailabilityOverrides.id, id))
        .returning();

      for (const deleteId of mergePlan.mergedOverride.deleteIds) {
        await this.db
          .delete(doctorAvailabilityOverrides)
          .where(eq(doctorAvailabilityOverrides.id, deleteId));
      }

      return override;
    }

    const [override] = await this.db
      .update(doctorAvailabilityOverrides)
      .set({
        doctor_id: nextDoctorId,
        date: nextDate,
        type: nextType,
        start_time: nextStartTime,
        end_time: nextEndTime,
        reason: nextReason ?? null,
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

  private async ensureSingleBlackout(
    doctorId: string,
    date: string,
    clinicId: string,
    excludeId?: string,
  ) {
    const existing = await this.db
      .select({ id: doctorAvailabilityOverrides.id })
      .from(doctorAvailabilityOverrides)
      .where(
        and(
          eq(doctorAvailabilityOverrides.doctor_id, doctorId),
          eq(doctorAvailabilityOverrides.clinic_id, clinicId),
          eq(doctorAvailabilityOverrides.date, date),
          eq(doctorAvailabilityOverrides.type, 'blackout'),
        ),
      );

    const conflict = existing.find(
      (row: { id: string }) => row.id !== excludeId,
    );

    if (conflict) {
      throw new ConflictException(
        'An availability override with this doctor, date, and type already exists',
      );
    }
  }

  private async buildCustomHoursMergePlan(params: {
    clinicId: string;
    doctorId: string;
    date: string;
    startTime: string;
    endTime: string;
    reason?: string | null;
    currentId: string | null;
  }) {
    const sameDayCustomHours = await this.db
      .select()
      .from(doctorAvailabilityOverrides)
      .where(
        and(
          eq(doctorAvailabilityOverrides.doctor_id, params.doctorId),
          eq(doctorAvailabilityOverrides.clinic_id, params.clinicId),
          eq(doctorAvailabilityOverrides.date, params.date),
          eq(doctorAvailabilityOverrides.type, 'custom_hours'),
        ),
      );

    const relevantOverrides = sameDayCustomHours.filter(
      (override: OverrideRecord) => override.id !== params.currentId,
    );
    const candidateRange = {
      start: this.timeToMinutes(params.startTime),
      end: this.timeToMinutes(params.endTime),
    };
    let mergedRange = candidateRange;
    const mergeableOverrides: OverrideRecord[] = [];
    let didExpand = true;

    while (didExpand) {
      didExpand = false;

      for (const override of relevantOverrides) {
        if (
          !override.start_time ||
          !override.end_time ||
          mergeableOverrides.some(
            (mergeableOverride) => mergeableOverride.id === override.id,
          )
        ) {
          continue;
        }

        const existingRange = {
          start: this.timeToMinutes(override.start_time),
          end: this.timeToMinutes(override.end_time),
        };

        if (!this.rangesOverlapOrTouch(mergedRange, existingRange)) {
          continue;
        }

        mergeableOverrides.push(override);
        mergedRange = {
          start: Math.min(mergedRange.start, existingRange.start),
          end: Math.max(mergedRange.end, existingRange.end),
        };
        didExpand = true;
      }
    }

    await this.ensureNoAppointmentConflict(
      params.doctorId,
      params.date,
      params.clinicId,
      this.minutesToTime(mergedRange.start),
      this.minutesToTime(mergedRange.end),
    );

    if (mergeableOverrides.length === 0) {
      return { mergedOverride: null };
    }

    const keepId = params.currentId ?? mergeableOverrides[0].id;

    return {
      mergedOverride: {
        keepId,
        deleteIds: mergeableOverrides
          .map((override) => override.id)
          .filter((overrideId) => overrideId !== keepId),
        startTime: this.minutesToTime(mergedRange.start),
        endTime: this.minutesToTime(mergedRange.end),
        reason:
          params.reason ??
          mergeableOverrides.find((override) => override.id === keepId)?.reason ??
          mergeableOverrides[0]?.reason ??
          null,
      },
    };
  }

  private async ensureNoAppointmentConflict(
    doctorId: string,
    date: string,
    clinicId: string,
    startTime: string,
    endTime: string,
  ) {
    const existingAppointments = await this.db
      .select({
        start_time: appointments.start_time,
        end_time: appointments.end_time,
        status: appointments.status,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.doctor_id, doctorId),
          eq(appointments.clinic_id, clinicId),
          eq(appointments.appointment_date, date),
        ),
      );

    const hasConflict = existingAppointments.some(
      (appointment: {
        start_time: string;
        end_time: string;
        status: string;
      }) => {
        if (appointment.status === 'cancelled') {
          return false;
        }

        return (
          appointment.start_time.slice(0, 5) < endTime &&
          appointment.end_time.slice(0, 5) > startTime
        );
      },
    );

    if (hasConflict) {
      throw new ConflictException(
        'A custom-hours block cannot overlap an existing appointment',
      );
    }
  }

  private rangesOverlapOrTouch(
    left: { start: number; end: number },
    right: { start: number; end: number },
  ) {
    return left.start <= right.end && right.start <= left.end;
  }

  private timeToMinutes(time: string) {
    const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(totalMinutes: number) {
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}
