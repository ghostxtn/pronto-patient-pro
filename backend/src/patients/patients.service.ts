import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { patients } from '../database/schema';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async create(dto: CreatePatientDto, clinicId: string) {
    const [patient] = await this.db
      .insert(patients)
      .values({
        clinic_id: clinicId,
        first_name: dto.firstName,
        last_name: dto.lastName,
        tc_no: dto.tcNo,
        birth_date: dto.birthDate,
        gender: dto.gender,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        notes: dto.notes,
      })
      .returning();

    return patient;
  }

  async findAllByClinic(clinicId: string) {
    return this.db
      .select()
      .from(patients)
      .where(and(eq(patients.clinic_id, clinicId), eq(patients.is_active, true)));
  }

  async findById(id: string, clinicId: string) {
    const [patient] = await this.db
      .select()
      .from(patients)
      .where(and(eq(patients.id, id), eq(patients.clinic_id, clinicId)))
      .limit(1);

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return patient;
  }

  async update(id: string, dto: UpdatePatientDto, clinicId: string) {
    await this.findById(id, clinicId);

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (dto.firstName !== undefined) {
      updateData.first_name = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      updateData.last_name = dto.lastName;
    }
    if (dto.tcNo !== undefined) {
      updateData.tc_no = dto.tcNo;
    }
    if (dto.birthDate !== undefined) {
      updateData.birth_date = dto.birthDate;
    }
    if (dto.gender !== undefined) {
      updateData.gender = dto.gender;
    }
    if (dto.phone !== undefined) {
      updateData.phone = dto.phone;
    }
    if (dto.email !== undefined) {
      updateData.email = dto.email;
    }
    if (dto.address !== undefined) {
      updateData.address = dto.address;
    }
    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    const [patient] = await this.db
      .update(patients)
      .set(updateData)
      .where(eq(patients.id, id))
      .returning();

    return patient;
  }

  async softDelete(id: string, clinicId: string) {
    await this.findById(id, clinicId);

    const [patient] = await this.db
      .update(patients)
      .set({
        is_active: false,
        updated_at: new Date(),
      })
      .where(eq(patients.id, id))
      .returning();

    return patient;
  }
}
