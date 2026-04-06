import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, gte, lte } from 'drizzle-orm';
import {
  doctorAvailabilityOverrides,
  doctors,
} from '../database/schema';
import { CreateAvailabilityOverrideDto } from './dto/create-availability-override.dto';
import { UpdateAvailabilityOverrideDto } from './dto/update-availability-override.dto';

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
    await this.ensureOverrideCompatibility({
      clinicId,
      doctorId: dto.doctor_id,
      date: dto.date,
      type: dto.type,
      startTime: dto.start_time,
      endTime: dto.end_time,
    });

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
    await this.ensureOverrideCompatibility({
      clinicId,
      doctorId: nextDoctorId,
      date: nextDate,
      type: nextType,
      startTime: nextStartTime ?? undefined,
      endTime: nextEndTime ?? undefined,
      excludeId: id,
    });

    const [override] = await this.db
      .update(doctorAvailabilityOverrides)
      .set({
        doctor_id: nextDoctorId,
        date: nextDate,
        type: nextType,
        start_time: nextType === 'blackout' ? null : nextStartTime,
        end_time: nextType === 'blackout' ? null : nextEndTime,
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

  private async ensureOverrideCompatibility(params: {
    clinicId: string;
    doctorId: string;
    date: string;
    type: string;
    startTime?: string | null;
    endTime?: string | null;
    excludeId?: string;
  }) {
    const existingOverrides = await this.db
      .select()
      .from(doctorAvailabilityOverrides)
      .where(
        and(
          eq(doctorAvailabilityOverrides.doctor_id, params.doctorId),
          eq(doctorAvailabilityOverrides.clinic_id, params.clinicId),
          eq(doctorAvailabilityOverrides.date, params.date),
        ),
      );

    const comparableOverrides = existingOverrides.filter(
      (override: { id: string }) => override.id !== params.excludeId,
    );

    if (params.type === 'blackout' && comparableOverrides.length > 0) {
      throw new ConflictException('Blackout cannot coexist with other overrides');
    }

    if (params.type !== 'custom_hours') {
      return;
    }

    const blackoutOverride = comparableOverrides.find(
      (override: { type: string }) => override.type === 'blackout',
    );

    if (blackoutOverride) {
      throw new ConflictException(
        'Custom hours cannot coexist with blackout',
      );
    }

    const nextRange = {
      start: this.timeToMinutes(params.startTime as string),
      end: this.timeToMinutes(params.endTime as string),
    };

    const hasTimeConflict = comparableOverrides
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
      .some(
        (override: {
          start_time: string;
          end_time: string;
        }) =>
          this.rangesOverlapOrTouch(nextRange, {
            start: this.timeToMinutes(override.start_time),
            end: this.timeToMinutes(override.end_time),
          }),
      );

    if (hasTimeConflict) {
      throw new ConflictException('Custom hours cannot overlap or touch');
    }
  }

  private rangesOverlapOrTouch(
    left: { start: number; end: number },
    right: { start: number; end: number },
  ) {
    return left.start <= right.end && right.start <= left.end;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
    return hours * 60 + minutes;
  }
}
