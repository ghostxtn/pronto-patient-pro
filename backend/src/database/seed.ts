import * as bcrypt from 'bcrypt';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  clinics,
  patients,
  doctors,
  specializations,
  users,
} from './schema';

type ClinicRecord = typeof clinics.$inferSelect;
type UserRecord = typeof users.$inferSelect;
type SpecializationRecord = typeof specializations.$inferSelect;
type UserSeed = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'admin' | 'doctor' | 'patient';
};

type ClinicSeed = {
  clinic: {
    name: string;
    slug: string;
    domain: string;
    phone: string;
    email: string;
    address: string;
  };
  owner: UserSeed;
  admin: UserSeed;
  doctor: UserSeed & {
    title: string;
    bio: string;
    phone: string;
  };
  patient: UserSeed & {
    phone: string;
  };
  specializations: Array<{
    name: string;
    description: string;
  }>;
};

const clinicSeeds: ClinicSeed[] = [
  {
    clinic: {
      name: 'Test Klinik',
      slug: 'test-klinik',
      domain: 'test-klinik.localhost',
      phone: '+90 212 000 00 00',
      email: 'info@testklinik.local',
      address: 'Istanbul',
    },
    owner: {
      email: 'owner@testklinik.local',
      password: 'Owner123!',
      firstName: 'Test',
      lastName: 'Owner',
      role: 'owner',
    },
    admin: {
      email: 'admin@testklinik.local',
      password: 'Admin123!',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin',
    },
    doctor: {
      email: 'doctor@testklinik.local',
      password: 'Doctor123!',
      firstName: 'Deniz',
      lastName: 'Yilmaz',
      role: 'doctor',
      title: 'Uzm. Dr.',
      bio: 'Kardiyoloji odakli demo doktor hesabi.',
      phone: '+90 555 000 00 01',
    },
    patient: {
      email: 'patient@testklinik.local',
      password: 'Patient123!',
      firstName: 'Ayse',
      lastName: 'Demir',
      role: 'patient',
      phone: '+90 555 000 00 11',
    },
    specializations: [
      {
        name: 'Kardiyoloji',
        description: 'Kalp ve damar hastaliklari.',
      },
      {
        name: 'Dahiliye',
        description: 'Ic hastaliklari.',
      },
      {
        name: 'Cildiye',
        description: 'Deri ve zührevi hastaliklar.',
      },
    ],
  },
  {
    clinic: {
      name: 'Yeni Klinik',
      slug: 'yeni-klinik',
      domain: 'yeni-klinik.localhost',
      phone: '+90 216 000 00 00',
      email: 'info@yeniklinik.local',
      address: 'Ankara',
    },
    owner: {
      email: 'owner@yeniklinik.local',
      password: 'Owner123!',
      firstName: 'Yeni',
      lastName: 'Owner',
      role: 'owner',
    },
    admin: {
      email: 'admin@yeniklinik.local',
      password: 'Admin123!',
      firstName: 'Yeni',
      lastName: 'Admin',
      role: 'admin',
    },
    doctor: {
      email: 'doctor@yeniklinik.local',
      password: 'Doctor123!',
      firstName: 'Mert',
      lastName: 'Kaya',
      role: 'doctor',
      title: 'Dr.',
      bio: 'Dahiliye odakli demo doktor hesabi.',
      phone: '+90 555 000 00 02',
    },
    patient: {
      email: 'patient@yeniklinik.local',
      password: 'Patient123!',
      firstName: 'Zeynep',
      lastName: 'Aydin',
      role: 'patient',
      phone: '+90 555 000 00 12',
    },
    specializations: [
      {
        name: 'Dahiliye',
        description: 'Ic hastaliklari.',
      },
      {
        name: 'Noroloji',
        description: 'Sinir sistemi hastaliklari.',
      },
      {
        name: 'Ortopedi',
        description: 'Kas ve iskelet sistemi hastaliklari.',
      },
    ],
  },
];

async function ensureClinicFromSeed(
  db: ReturnType<typeof drizzle>,
  clinicSeed: ClinicSeed['clinic'],
) {
  const [existingClinic] = await db
    .select()
    .from(clinics)
    .where(eq(clinics.domain, clinicSeed.domain))
    .limit(1);

  if (existingClinic) {
    return existingClinic;
  }

  const [createdClinic] = await db
    .insert(clinics)
    .values(clinicSeed)
    .returning();

  return createdClinic;
}

async function ensureUser(
  db: ReturnType<typeof drizzle>,
  clinic: ClinicRecord,
  userSeed: UserSeed,
) {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, userSeed.email), eq(users.clinic_id, clinic.id)))
    .limit(1);

  if (existingUser) {
    return existingUser;
  }

  const passwordHash = await bcrypt.hash(userSeed.password, 12);

  const [createdUser] = await db
    .insert(users)
    .values({
      email: userSeed.email,
      password_hash: passwordHash,
      first_name: userSeed.firstName,
      last_name: userSeed.lastName,
      role: userSeed.role,
      clinic_id: clinic.id,
    })
    .returning();

  return createdUser;
}

async function ensureSpecialization(
  db: ReturnType<typeof drizzle>,
  clinic: ClinicRecord,
  specializationSeed: ClinicSeed['specializations'][number],
) {
  const [existingSpecialization] = await db
    .select()
    .from(specializations)
    .where(
      and(
        eq(specializations.name, specializationSeed.name),
        eq(specializations.clinic_id, clinic.id),
      ),
    )
    .limit(1);

  if (existingSpecialization) {
    return existingSpecialization;
  }

  const [createdSpecialization] = await db
    .insert(specializations)
    .values({
      ...specializationSeed,
      clinic_id: clinic.id,
    })
    .returning();

  return createdSpecialization;
}

async function ensurePatientProfile(
  db: ReturnType<typeof drizzle>,
  clinic: ClinicRecord,
  patientUser: UserRecord,
  patientSeed: ClinicSeed['patient'],
) {
  const [existingPatient] = await db
    .select()
    .from(patients)
    .where(and(eq(patients.user_id, patientUser.id), eq(patients.clinic_id, clinic.id)))
    .limit(1);

  if (existingPatient) {
    return existingPatient;
  }

  const [createdPatient] = await db
    .insert(patients)
    .values({
      clinic_id: clinic.id,
      user_id: patientUser.id,
      first_name: patientSeed.firstName,
      last_name: patientSeed.lastName,
      email: patientSeed.email,
      phone: patientSeed.phone,
    })
    .returning();

  return createdPatient;
}

async function ensureDoctorProfile(
  db: ReturnType<typeof drizzle>,
  clinic: ClinicRecord,
  doctorUser: UserRecord,
  specialization: SpecializationRecord,
  doctorSeed: ClinicSeed['doctor'],
) {
  const [existingDoctor] = await db
    .select()
    .from(doctors)
    .where(eq(doctors.user_id, doctorUser.id))
    .limit(1);

  if (existingDoctor) {
    return existingDoctor;
  }

  const [createdDoctor] = await db
    .insert(doctors)
    .values({
      user_id: doctorUser.id,
      specialization_id: specialization.id,
      clinic_id: clinic.id,
      title: doctorSeed.title,
      bio: doctorSeed.bio,
      phone: doctorSeed.phone,
      is_active: true,
    })
    .returning();

  return createdDoctor;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required to run the seed script.');
  }

  const pool = new Pool({
    connectionString,
  });

  const db = drizzle(pool);

  try {
    console.log('Seed completed.');

    for (const clinicSeed of clinicSeeds) {
      const clinic = await ensureClinicFromSeed(db, clinicSeed.clinic);
      const owner = await ensureUser(db, clinic, clinicSeed.owner);
      const admin = await ensureUser(db, clinic, clinicSeed.admin);
      const doctorUser = await ensureUser(db, clinic, clinicSeed.doctor);
      const patientUser = await ensureUser(db, clinic, clinicSeed.patient);

      const seededSpecializations = [];
      for (const specializationSeed of clinicSeed.specializations) {
        const specialization = await ensureSpecialization(
          db,
          clinic,
          specializationSeed,
        );
        seededSpecializations.push(specialization);
      }

      const primarySpecialization = seededSpecializations[0];
      const doctor = await ensureDoctorProfile(
        db,
        clinic,
        doctorUser,
        primarySpecialization,
        clinicSeed.doctor,
      );
      const patient = await ensurePatientProfile(
        db,
        clinic,
        patientUser,
        clinicSeed.patient,
      );

      console.log(`Clinic: ${clinic.domain}`);
      console.log(`Owner: ${owner.email} / ${clinicSeed.owner.password}`);
      console.log(`Admin: ${admin.email} / ${clinicSeed.admin.password}`);
      console.log(`Doctor: ${doctorUser.email} / ${clinicSeed.doctor.password}`);
      console.log(`Patient: ${patientUser.email} / ${clinicSeed.patient.password}`);
      console.log(`Doctor profile: ${doctor.id}`);
      console.log(`Patient profile: ${patient.id}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Seed failed.');
  console.error(error);
  process.exit(1);
});
