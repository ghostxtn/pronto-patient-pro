import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { specializations } from '../database/schema';
import { CreateSpecializationDto } from './dto/create-specialization.dto';
import { UpdateSpecializationDto } from './dto/update-specialization.dto';

@Injectable()
export class SpecializationsService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async create(dto: CreateSpecializationDto, clinicId: string) {
    const [specialization] = await this.db
      .insert(specializations)
      .values({
        ...dto,
        clinic_id: clinicId,
      })
      .returning();

    return specialization;
  }

  async findAllByClinic(clinicId: string) {
    return this.db
      .select()
      .from(specializations)
      .where(
        and(
          eq(specializations.clinic_id, clinicId),
          eq(specializations.is_active, true),
        ),
      );
  }

  async findById(id: string, clinicId: string) {
    const [specialization] = await this.db
      .select()
      .from(specializations)
      .where(eq(specializations.id, id))
      .limit(1);

    if (!specialization) {
      throw new NotFoundException('Specialization not found');
    }

    if (specialization.clinic_id !== clinicId) {
      throw new ForbiddenException('Access denied to this clinic');
    }

    return specialization;
  }

  async update(id: string, dto: UpdateSpecializationDto, clinicId: string) {
    await this.findById(id, clinicId);

    const [specialization] = await this.db
      .update(specializations)
      .set({
        ...dto,
        updated_at: new Date(),
      })
      .where(eq(specializations.id, id))
      .returning();

    return specialization;
  }

  async softDelete(id: string, clinicId: string) {
    await this.findById(id, clinicId);

    const [specialization] = await this.db
      .update(specializations)
      .set({
        is_active: false,
        updated_at: new Date(),
      })
      .where(eq(specializations.id, id))
      .returning();

    return specialization;
  }
}
