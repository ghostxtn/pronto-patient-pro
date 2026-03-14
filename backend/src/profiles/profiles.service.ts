import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { users } from '../database/schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async getMyProfile(userId: string) {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        role: users.role,
        clinic_id: users.clinic_id,
        is_active: users.is_active,
        google_id: users.google_id,
        avatar_url: users.avatar_url,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (dto.firstName !== undefined) {
      updateData.first_name = dto.firstName;
    }

    if (dto.lastName !== undefined) {
      updateData.last_name = dto.lastName;
    }

    if (dto.avatarUrl !== undefined) {
      updateData.avatar_url = dto.avatarUrl;
    }

    const [user] = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        role: users.role,
        clinic_id: users.clinic_id,
        is_active: users.is_active,
        google_id: users.google_id,
        avatar_url: users.avatar_url,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findAllByClinic(clinicId: string) {
    return this.db
      .select({
        id: users.id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        role: users.role,
        clinic_id: users.clinic_id,
        is_active: users.is_active,
        google_id: users.google_id,
        avatar_url: users.avatar_url,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(and(eq(users.clinic_id, clinicId), eq(users.is_active, true)));
  }

  async updateRole(userId: string, role: string, requestorClinicId: string) {
    const [targetUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (targetUser.clinic_id !== requestorClinicId) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const [updatedUser] = await this.db
      .update(users)
      .set({
        role,
        updated_at: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        role: users.role,
        clinic_id: users.clinic_id,
        is_active: users.is_active,
        google_id: users.google_id,
        avatar_url: users.avatar_url,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    return updatedUser;
  }
}
