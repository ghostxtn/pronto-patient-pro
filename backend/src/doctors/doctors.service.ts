import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { doctors, specializations, users } from '../database/schema';
import { AdminSetDoctorStatusDto } from './dto/admin-set-doctor-status.dto';
import { AdminUpdateDoctorDto } from './dto/admin-update-doctor.dto';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { OnboardDoctorDto } from './dto/onboard-doctor.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async create(dto: CreateDoctorDto, clinicId: string) {
    const [doctor] = await this.db
      .insert(doctors)
      .values({
        user_id: dto.userId,
        specialization_id: dto.specializationId,
        clinic_id: clinicId,
        title: dto.title,
        bio: dto.bio,
        phone: dto.phone,
      })
      .returning();

    return doctor;
  }

  async onboardDoctor(dto: OnboardDoctorDto, clinicId: string) {
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const [newUser] = await this.db
      .insert(users)
      .values({
        first_name: dto.firstName,
        last_name: dto.lastName,
        email: dto.email,
        password_hash: passwordHash,
        role: 'doctor',
        clinic_id: clinicId,
      })
      .returning();

    const [doctor] = await this.db
      .insert(doctors)
      .values({
        user_id: newUser.id,
        specialization_id: dto.specializationId,
        clinic_id: clinicId,
        title: dto.title,
        bio: dto.bio,
        phone: dto.phone,
        is_active: true,
      })
      .returning();

    return doctor;
  }

  async findAllByClinic(
    clinicId: string,
    specializationId?: string,
    status: string = 'active',
  ) {
    const conditions = [eq(doctors.clinic_id, clinicId)];

    if (status === 'active') {
      conditions.push(eq(doctors.is_active, true));
    }

    if (status === 'inactive') {
      conditions.push(eq(doctors.is_active, false));
    }

    if (specializationId) {
      conditions.push(eq(doctors.specialization_id, specializationId));
    }

    return this.db
      .select({
        id: doctors.id,
        user_id: doctors.user_id,
        specialization_id: doctors.specialization_id,
        clinic_id: doctors.clinic_id,
        title: doctors.title,
        bio: doctors.bio,
        phone: doctors.phone,
        is_active: doctors.is_active,
        firstName: users.first_name,
        lastName: users.last_name,
        email: users.email,
        avatarUrl: users.avatar_url,
        specialization: {
          id: specializations.id,
          name: specializations.name,
        },
      })
      .from(doctors)
      .innerJoin(users, eq(doctors.user_id, users.id))
      .leftJoin(specializations, eq(doctors.specialization_id, specializations.id))
      .where(and(...conditions));
  }

  async findPublicDiscoveryByClinic(clinicId: string) {
    return this.db
      .select({
        id: doctors.id,
        title: doctors.title,
        bio: doctors.bio,
        firstName: users.first_name,
        lastName: users.last_name,
        avatarUrl: users.avatar_url,
        specialization: {
          id: specializations.id,
          name: specializations.name,
        },
      })
      .from(doctors)
      .innerJoin(users, eq(doctors.user_id, users.id))
      .leftJoin(specializations, eq(doctors.specialization_id, specializations.id))
      .where(and(eq(doctors.clinic_id, clinicId), eq(doctors.is_active, true)));
  }

  async findById(id: string, clinicId: string) {
    const [doctor] = await this.db
      .select({
        id: doctors.id,
        user_id: doctors.user_id,
        specialization_id: doctors.specialization_id,
        clinic_id: doctors.clinic_id,
        title: doctors.title,
        bio: doctors.bio,
        phone: doctors.phone,
        is_active: doctors.is_active,
        firstName: users.first_name,
        lastName: users.last_name,
        email: users.email,
        avatarUrl: users.avatar_url,
        specialization: {
          id: specializations.id,
          name: specializations.name,
          description: specializations.description,
        },
      })
      .from(doctors)
      .innerJoin(users, eq(doctors.user_id, users.id))
      .leftJoin(specializations, eq(doctors.specialization_id, specializations.id))
      .where(eq(doctors.id, id))
      .limit(1);

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    if (doctor.clinic_id !== clinicId) {
      throw new ForbiddenException('Access denied to this clinic');
    }

    return doctor;
  }

  async findByUserId(userId: string, clinicId: string) {
    const [doctor] = await this.db
      .select({
        id: doctors.id,
        user_id: doctors.user_id,
        specialization_id: doctors.specialization_id,
        clinic_id: doctors.clinic_id,
        title: doctors.title,
        bio: doctors.bio,
        phone: doctors.phone,
        is_active: doctors.is_active,
        firstName: users.first_name,
        lastName: users.last_name,
        email: users.email,
        specialization: {
          id: specializations.id,
          name: specializations.name,
        },
      })
      .from(doctors)
      .innerJoin(users, eq(doctors.user_id, users.id))
      .leftJoin(specializations, eq(doctors.specialization_id, specializations.id))
      .where(and(eq(doctors.user_id, userId), eq(doctors.clinic_id, clinicId), eq(doctors.is_active, true)))
      .limit(1);

    return doctor ?? null;
  }

  async update(id: string, dto: UpdateDoctorDto, clinicId: string) {
    await this.findById(id, clinicId);

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (dto.specializationId !== undefined) {
      updateData.specialization_id = dto.specializationId;
    }

    if (dto.title !== undefined) {
      updateData.title = dto.title;
    }

    if (dto.bio !== undefined) {
      updateData.bio = dto.bio;
    }

    if (dto.phone !== undefined) {
      updateData.phone = dto.phone;
    }

    const [doctor] = await this.db
      .update(doctors)
      .set(updateData)
      .where(eq(doctors.id, id))
      .returning();

    return doctor;
  }

  async adminUpdateDoctor(id: string, dto: AdminUpdateDoctorDto, clinicId: string) {
    const [doctor] = await this.db
      .select()
      .from(doctors)
      .where(eq(doctors.id, id))
      .limit(1);

    if (!doctor || doctor.clinic_id !== clinicId) {
      throw new NotFoundException('Doctor not found');
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, doctor.user_id))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.email !== dto.email) {
      const [existingUser] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, dto.email))
        .limit(1);

      if (existingUser && existingUser.id !== user.id) {
        throw new BadRequestException('Email already in use');
      }
    }

    await this.db
      .update(users)
      .set({
        first_name: dto.firstName,
        last_name: dto.lastName,
        email: dto.email,
        updated_at: new Date(),
      })
      .where(eq(users.id, user.id));

    const [updatedDoctor] = await this.db
      .update(doctors)
      .set({
        specialization_id: dto.specializationId,
        title: dto.title,
        bio: dto.bio,
        phone: dto.phone,
        updated_at: new Date(),
      })
      .where(eq(doctors.id, id))
      .returning();

    return updatedDoctor;
  }

  async adminSetDoctorStatus(id: string, dto: AdminSetDoctorStatusDto, clinicId: string) {
    const [doctor] = await this.db
      .select()
      .from(doctors)
      .where(eq(doctors.id, id))
      .limit(1);

    if (!doctor || doctor.clinic_id !== clinicId) {
      throw new NotFoundException('Doctor not found');
    }

    const [updatedDoctor] = await this.db
      .update(doctors)
      .set({
        is_active: dto.isActive,
        updated_at: new Date(),
      })
      .where(eq(doctors.id, id))
      .returning();

    return updatedDoctor;
  }

  async softDelete(id: string, clinicId: string) {
    await this.findById(id, clinicId);

    const [doctor] = await this.db
      .update(doctors)
      .set({
        is_active: false,
        updated_at: new Date(),
      })
      .where(eq(doctors.id, id))
      .returning();

    return doctor;
  }
}
