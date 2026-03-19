import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { doctors, specializations, users } from '../database/schema';

@Injectable()
export class HomepagePreviewService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async getHomepagePreview(clinicId: string) {
    const [doctorPreview, specialtyPreview] = await Promise.all([
      this.getDoctorPreview(clinicId),
      this.getSpecialtyPreview(clinicId),
    ]);

    return {
      doctors: doctorPreview,
      specialties: specialtyPreview,
    };
  }

  private getDoctorPreview(clinicId: string) {
    return this.db
      .select({
        id: doctors.id,
        firstName: users.first_name,
        lastName: users.last_name,
        title: doctors.title,
        bio: doctors.bio,
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

  private getSpecialtyPreview(clinicId: string) {
    return this.db
      .select({
        id: specializations.id,
        name: specializations.name,
        description: specializations.description,
      })
      .from(specializations)
      .where(
        and(
          eq(specializations.clinic_id, clinicId),
          eq(specializations.is_active, true),
        ),
      );
  }
}
