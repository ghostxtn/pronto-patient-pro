import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { patients } from '../database/schema';
import { EncryptionService } from '../encryption/encryption.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  private readonly ENCRYPTED_FIELDS = [
    'first_name',
    'last_name',
    'tc_no',
    'phone',
    'email',
    'address',
  ];

  constructor(
    @Inject('DRIZZLE') private readonly db: any,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(dto: CreatePatientDto, clinicId: string) {
    const rawData: Record<string, any> = {
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
    };

    if (rawData.tc_no) {
      rawData.tc_no_hash = await this.encryptionService.hmac(rawData.tc_no, clinicId);
    }

    const encryptedData = await this.encryptionService.encryptFields(
      rawData,
      this.ENCRYPTED_FIELDS,
      clinicId,
    );

    const [patient] = await this.db.insert(patients).values(encryptedData).returning();

    return this.encryptionService.decryptFields(
      patient,
      this.ENCRYPTED_FIELDS,
      clinicId,
    );
  }

  async findAllByClinic(clinicId: string) {
    const results = await this.db
      .select()
      .from(patients)
      .where(and(eq(patients.clinic_id, clinicId), eq(patients.is_active, true)));

    return Promise.all(
      results.map((p: any) =>
        this.encryptionService.decryptFields(p, this.ENCRYPTED_FIELDS, clinicId),
      ),
    );
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

    return this.encryptionService.decryptFields(
      patient,
      this.ENCRYPTED_FIELDS,
      clinicId,
    );
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

    if (updateData.tc_no) {
      updateData.tc_no_hash = await this.encryptionService.hmac(
        updateData.tc_no as string,
        clinicId,
      );
    }

    const fieldsToEncrypt = this.ENCRYPTED_FIELDS.filter(
      (f) => updateData[f] !== undefined,
    );
    const encryptedUpdate = await this.encryptionService.encryptFields(
      updateData,
      fieldsToEncrypt,
      clinicId,
    );

    const [patient] = await this.db
      .update(patients)
      .set(encryptedUpdate)
      .where(eq(patients.id, id))
      .returning();

    return this.encryptionService.decryptFields(
      patient,
      this.ENCRYPTED_FIELDS,
      clinicId,
    );
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

    return this.encryptionService.decryptFields(
      patient,
      this.ENCRYPTED_FIELDS,
      clinicId,
    );
  }

  async findByTcNo(tcNo: string, clinicId: string) {
    const hash = await this.encryptionService.hmac(tcNo, clinicId);
    const results = await this.db
      .select()
      .from(patients)
      .where(and(eq(patients.tc_no_hash, hash), eq(patients.clinic_id, clinicId)))
      .limit(1);
    if (results.length === 0) return null;
    return this.encryptionService.decryptFields(
      results[0],
      this.ENCRYPTED_FIELDS,
      clinicId,
    );
  }
}
