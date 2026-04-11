import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { clinics } from '../database/schema';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

@Injectable()
export class ClinicsService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async create(dto: CreateClinicDto) {
    const [clinic] = await this.db.insert(clinics).values(dto).returning();
    return clinic;
  }

  async findAll() {
    return this.db
      .select()
      .from(clinics)
      .where(eq(clinics.is_active, true));
  }

  async findById(id: string) {
    const [clinic] = await this.db
      .select()
      .from(clinics)
      .where(eq(clinics.id, id))
      .limit(1);

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    return clinic;
  }

  async update(id: string, dto: UpdateClinicDto) {
    const [clinic] = await this.db
      .update(clinics)
      .set({
        ...dto,
        updated_at: new Date(),
      })
      .where(eq(clinics.id, id))
      .returning();

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    return clinic;
  }

  async updateLogoUrl(id: string, logoUrl: string) {
    const [clinic] = await this.db
      .update(clinics)
      .set({
        logo_url: logoUrl,
        updated_at: new Date(),
      })
      .where(eq(clinics.id, id))
      .returning();

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    return clinic;
  }

  async softDelete(id: string) {
    const [clinic] = await this.db
      .update(clinics)
      .set({
        is_active: false,
        updated_at: new Date(),
      })
      .where(and(eq(clinics.id, id)))
      .returning();

    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    return clinic;
  }
}
