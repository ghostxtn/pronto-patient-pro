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
    await this.ensureNoDuplicate(dto.doctor_id, dto.date, dto.type, clinicId);

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
    const nextReason = dto.reason !== undefined ? dto.reason : existing.reason;

    await this.ensureDoctorInClinic(nextDoctorId, clinicId);
    this.validateOverridePayload({
      type: nextType,
      start_time: nextStartTime ?? undefined,
      end_time: nextEndTime ?? undefined,
    });

    if (
      nextDoctorId !== existing.doctor_id ||
      nextDate !== existing.date ||
      nextType !== existing.type
    ) {
      await this.ensureNoDuplicate(nextDoctorId, nextDate, nextType, clinicId, id);
    }

    const [override] = await this.db
      .update(doctorAvailabilityOverrides)
      .set({
        doctor_id: nextDoctorId,
        date: nextDate,
        type: nextType,
        start_time: nextStartTime ?? null,
        end_time: nextEndTime ?? null,
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
      const hasStart = Boolean(dto.start_time);
      const hasEnd = Boolean(dto.end_time);

      if (hasStart !== hasEnd) {
        throw new BadRequestException(
          'start_time and end_time must both be provided for timed blackout',
        );
      }

      if (dto.start_time && dto.end_time && dto.start_time >= dto.end_time) {
        throw new BadRequestException(
          'start_time must be before end_time for blackout',
        );
      }
    }
  }

  private async ensureNoDuplicate(
    doctorId: string,
    date: string,
    type: string,
    clinicId: string,
    excludeId?: string,
  ) {
    const existing = await this.db
      .select({
        id: doctorAvailabilityOverrides.id,
      })
      .from(doctorAvailabilityOverrides)
      .where(
        and(
          eq(doctorAvailabilityOverrides.doctor_id, doctorId),
          eq(doctorAvailabilityOverrides.clinic_id, clinicId),
          eq(doctorAvailabilityOverrides.date, date),
          eq(doctorAvailabilityOverrides.type, type),
        ),
      );

    const conflict = existing.find((row: { id: string }) => row.id !== excludeId);
    if (conflict) {
      throw new ConflictException(
        'An availability override with this doctor, date, and type already exists',
      );
    }
  }
}
