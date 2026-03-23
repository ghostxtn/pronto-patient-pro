CREATE SCHEMA IF NOT EXISTS drizzle;

CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id serial PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint NOT NULL
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone varchar(20);
ALTER TABLE "patients"
ADD COLUMN IF NOT EXISTS "user_id" uuid;
ALTER TABLE "clinics"
ADD COLUMN IF NOT EXISTS "domain" varchar(255);

UPDATE "clinics"
SET "domain" = CASE
  WHEN "id" = '550e8400-e29b-41d4-a716-446655440000' THEN 'test-klinik.localhost'
  WHEN "id" = '9f652077-14df-4ada-9936-68a9eb90b3bc' THEN 'yeni-klinik.localhost'
  ELSE COALESCE(NULLIF("domain", ''), "slug" || '.localhost')
END
WHERE "domain" IS NULL OR "domain" = '';

ALTER TABLE "appointments"
ALTER COLUMN "status" SET DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS "doctor_availability_overrides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "clinic_id" uuid NOT NULL,
  "doctor_id" uuid NOT NULL,
  "date" date NOT NULL,
  "type" varchar(20) NOT NULL,
  "start_time" time,
  "end_time" time,
  "reason" varchar(255),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "patient_clinical_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "clinic_id" uuid NOT NULL,
  "patient_id" uuid NOT NULL,
  "doctor_id" uuid NOT NULL,
  "appointment_id" uuid,
  "diagnosis" text,
  "treatment" text,
  "prescription" text,
  "notes" text,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'patients_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "patients"
    ADD CONSTRAINT "patients_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
    ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clinics'
      AND column_name = 'domain'
  ) THEN
    ALTER TABLE "clinics"
    ALTER COLUMN "domain" SET NOT NULL;
  END IF;
END $$;

ALTER TABLE "users"
DROP CONSTRAINT IF EXISTS "users_email_unique";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clinics_domain_unique'
  ) THEN
    ALTER TABLE "clinics"
    ADD CONSTRAINT "clinics_domain_unique" UNIQUE ("domain");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_email_clinic_id_unique'
  ) THEN
    ALTER TABLE "users"
    ADD CONSTRAINT "users_email_clinic_id_unique"
    UNIQUE ("email", "clinic_id");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'doctor_availability_overrides_clinic_id_clinics_id_fk'
  ) THEN
    ALTER TABLE "doctor_availability_overrides"
    ADD CONSTRAINT "doctor_availability_overrides_clinic_id_clinics_id_fk"
    FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id")
    ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'doctor_availability_overrides_doctor_id_doctors_id_fk'
  ) THEN
    ALTER TABLE "doctor_availability_overrides"
    ADD CONSTRAINT "doctor_availability_overrides_doctor_id_doctors_id_fk"
    FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id")
    ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'doctor_availability_overrides_doctor_date_type_unique'
  ) THEN
    ALTER TABLE "doctor_availability_overrides"
    ADD CONSTRAINT "doctor_availability_overrides_doctor_date_type_unique"
    UNIQUE ("doctor_id", "date", "type");
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'patient_clinical_notes_clinic_id_clinics_id_fk'
  ) THEN
    ALTER TABLE "patient_clinical_notes"
    ADD CONSTRAINT "patient_clinical_notes_clinic_id_clinics_id_fk"
    FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id")
    ON DELETE no action ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'patient_clinical_notes_patient_id_patients_id_fk'
  ) THEN
    ALTER TABLE "patient_clinical_notes"
    ADD CONSTRAINT "patient_clinical_notes_patient_id_patients_id_fk"
    FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id")
    ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'patient_clinical_notes_doctor_id_doctors_id_fk'
  ) THEN
    ALTER TABLE "patient_clinical_notes"
    ADD CONSTRAINT "patient_clinical_notes_doctor_id_doctors_id_fk"
    FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id")
    ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'patient_clinical_notes_appointment_id_appointments_id_fk'
  ) THEN
    ALTER TABLE "patient_clinical_notes"
    ADD CONSTRAINT "patient_clinical_notes_appointment_id_appointments_id_fk"
    FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id")
    ON DELETE set null ON UPDATE no action;
  END IF;
END $$;

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT '0000_needy_matthew_murdock', 1773350781397
WHERE NOT EXISTS (
  SELECT 1
  FROM drizzle.__drizzle_migrations
  WHERE hash = '0000_needy_matthew_murdock'
);

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT '0001_mature_kulan_gath', 1773352436265
WHERE NOT EXISTS (
  SELECT 1
  FROM drizzle.__drizzle_migrations
  WHERE hash = '0001_mature_kulan_gath'
);

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT '0002_overrated_fenris', 1773354242535
WHERE NOT EXISTS (
  SELECT 1
  FROM drizzle.__drizzle_migrations
  WHERE hash = '0002_overrated_fenris'
);

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT '0003_ancient_mikhail_rasputin', 1773356013961
WHERE NOT EXISTS (
  SELECT 1
  FROM drizzle.__drizzle_migrations
  WHERE hash = '0003_ancient_mikhail_rasputin'
);

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT '0004_tenant_domain_and_scoped_user_email', 1774000000000
WHERE NOT EXISTS (
  SELECT 1
  FROM drizzle.__drizzle_migrations
  WHERE hash = '0004_tenant_domain_and_scoped_user_email'
);

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT '0005_staff_phone_on_users', 1774100000000
WHERE NOT EXISTS (
  SELECT 1
  FROM drizzle.__drizzle_migrations
  WHERE hash = '0005_staff_phone_on_users'
);

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT '0006_add_user_id_to_patients', 1774200000000
WHERE NOT EXISTS (
  SELECT 1
  FROM drizzle.__drizzle_migrations
  WHERE hash = '0006_add_user_id_to_patients'
);

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT '0007_hesitant_vargas', 1774895069409
WHERE NOT EXISTS (
  SELECT 1
  FROM drizzle.__drizzle_migrations
  WHERE hash = '0007_hesitant_vargas'
);

INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
SELECT '0008_bent_wrecking_crew', 1774895299082
WHERE NOT EXISTS (
  SELECT 1
  FROM drizzle.__drizzle_migrations
  WHERE hash = '0008_bent_wrecking_crew'
);
