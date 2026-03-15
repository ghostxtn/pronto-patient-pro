import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { users } from '../database/schema';
import { CreateStaffDto } from './dto/create-staff.dto';
import { SetStaffStatusDto } from './dto/set-staff-status.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

type StaffListParams = {
  search?: string;
  status?: string;
};

@Injectable()
export class StaffService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async findAllByClinic(clinicId: string, params: StaffListParams = {}) {
    const conditions = [
      eq(users.clinic_id, clinicId),
      eq(users.role, 'staff'),
    ];

    if (params.status === 'active') {
      conditions.push(eq(users.is_active, true));
    }

    if (params.status === 'inactive') {
      conditions.push(eq(users.is_active, false));
    }

    if (params.search?.trim()) {
      const pattern = `%${params.search.trim()}%`;
      conditions.push(
        or(
          ilike(users.first_name, pattern),
          ilike(users.last_name, pattern),
          ilike(users.email, pattern),
        )!,
      );
    }

    return this.db
      .select({
        id: users.id,
        firstName: users.first_name,
        lastName: users.last_name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        clinicId: users.clinic_id,
        isActive: users.is_active,
        createdAt: users.created_at,
        updatedAt: users.updated_at,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.created_at));
  }

  async create(dto: CreateStaffDto, clinicId: string) {
    await this.ensureUniqueEmail(dto.email, clinicId);

    const temporaryPassword = this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const [staffUser] = await this.db
      .insert(users)
      .values({
        first_name: dto.firstName,
        last_name: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        password_hash: passwordHash,
        role: 'staff',
        clinic_id: clinicId,
        is_active: dto.isActive ?? true,
      })
      .returning({
        id: users.id,
        firstName: users.first_name,
        lastName: users.last_name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        clinicId: users.clinic_id,
        isActive: users.is_active,
        createdAt: users.created_at,
        updatedAt: users.updated_at,
      });

    return {
      ...staffUser,
      temporaryPassword,
    };
  }

  async update(id: string, dto: UpdateStaffDto, clinicId: string) {
    const staffUser = await this.findStaffById(id, clinicId);

    if (dto.email && dto.email !== staffUser.email) {
      await this.ensureUniqueEmail(dto.email, clinicId, staffUser.id);
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (dto.firstName !== undefined) {
      updateData.first_name = dto.firstName;
    }

    if (dto.lastName !== undefined) {
      updateData.last_name = dto.lastName;
    }

    if (dto.email !== undefined) {
      updateData.email = dto.email;
    }

    if (dto.phone !== undefined) {
      updateData.phone = dto.phone;
    }

    if (dto.isActive !== undefined) {
      updateData.is_active = dto.isActive;
    }

    const [updatedUser] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        firstName: users.first_name,
        lastName: users.last_name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        clinicId: users.clinic_id,
        isActive: users.is_active,
        createdAt: users.created_at,
        updatedAt: users.updated_at,
      });

    return updatedUser;
  }

  async setStatus(id: string, dto: SetStaffStatusDto, clinicId: string) {
    await this.findStaffById(id, clinicId);

    const [updatedUser] = await this.db
      .update(users)
      .set({
        is_active: dto.isActive,
        updated_at: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        firstName: users.first_name,
        lastName: users.last_name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        clinicId: users.clinic_id,
        isActive: users.is_active,
        createdAt: users.created_at,
        updatedAt: users.updated_at,
      });

    return updatedUser;
  }

  async remove(id: string, clinicId: string) {
    await this.findStaffById(id, clinicId);

    const [deletedUser] = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
      });

    return deletedUser;
  }

  private async findStaffById(id: string, clinicId: string) {
    const [staffUser] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.clinic_id, clinicId), eq(users.role, 'staff')))
      .limit(1);

    if (!staffUser) {
      throw new NotFoundException('Staff user not found');
    }

    return staffUser;
  }

  private async ensureUniqueEmail(email: string, clinicId: string, excludeUserId?: string) {
    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.clinic_id, clinicId)))
      .limit(1);

    if (existingUser && existingUser.id !== excludeUserId) {
      throw new BadRequestException('Email already in use');
    }
  }

  private generateTemporaryPassword() {
    const randomChunk = Math.random().toString(36).slice(-8);
    return `Tmp${randomChunk}9!`;
  }
}
