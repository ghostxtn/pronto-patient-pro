ALTER TABLE "clinics" ADD COLUMN "domain" varchar(255);
--> statement-breakpoint
UPDATE "clinics"
SET "domain" = 'test-klinik.localhost'
WHERE "id" = '550e8400-e29b-41d4-a716-446655440000';
--> statement-breakpoint
UPDATE "clinics"
SET "domain" = 'yeni-klinik.localhost'
WHERE "id" = '9f652077-14df-4ada-9936-68a9eb90b3bc';
--> statement-breakpoint
ALTER TABLE "clinics" ALTER COLUMN "domain" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_domain_unique" UNIQUE("domain");
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_clinic_id_unique" UNIQUE("email","clinic_id");
