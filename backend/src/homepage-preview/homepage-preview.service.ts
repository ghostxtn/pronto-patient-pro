import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { clinics, doctors, specializations, users } from '../database/schema';

@Injectable()
export class HomepagePreviewService {
  constructor(@Inject('DRIZZLE') private readonly db: any) {}

  async getHomepagePreview(clinicId: string) {
    const [clinic, doctorPreview, specialtyPreview] = await Promise.all([
      this.getClinicPreview(clinicId),
      this.getDoctorPreview(clinicId),
      this.getSpecialtyPreview(clinicId),
    ]);

    return {
      clinic,
      doctors: doctorPreview,
      specialties: specialtyPreview,
    };
  }

  private async getClinicPreview(clinicId: string) {
    const [clinic] = await this.db
      .select({
        name: clinics.name,
        phone: clinics.phone,
        email: clinics.email,
        address: clinics.address,
        logo_url: clinics.logo_url,
        default_appointment_duration: clinics.default_appointment_duration,
        appointment_approval_mode: clinics.appointment_approval_mode,
        max_booking_days_ahead: clinics.max_booking_days_ahead,
        cancellation_hours_before: clinics.cancellation_hours_before,
      })
      .from(clinics)
      .where(and(eq(clinics.id, clinicId), eq(clinics.is_active, true)))
      .limit(1);

    return clinic ?? null;
  }

  private getDoctorPreview(clinicId: string) {
    return this.db
      .select({
        id: doctors.id,
        firstName: users.first_name,
        lastName: users.last_name,
        avatarUrl: users.avatar_url,
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
        imageUrl: specializations.imageUrl,
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
