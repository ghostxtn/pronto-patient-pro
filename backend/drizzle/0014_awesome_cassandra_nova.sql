ALTER TABLE "doctor_availability_overrides" DROP CONSTRAINT IF EXISTS "doctor_availability_overrides_doctor_date_type_unique";--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "logo_url" varchar(500);
