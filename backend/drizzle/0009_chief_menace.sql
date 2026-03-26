CREATE TABLE "clinic_encryption_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"encrypted_dek" text NOT NULL,
	"dek_version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"rotated_at" timestamp,
	CONSTRAINT "clinic_encryption_keys_clinic_id_unique" UNIQUE("clinic_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"user_id" uuid,
	"user_role" varchar(20),
	"action" varchar(50) NOT NULL,
	"entity" varchar(50) NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"request_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "first_name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "last_name" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "tc_no" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "phone" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "patients" ALTER COLUMN "email" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "kvkk_consent_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "kvkk_consent_version" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "kvkk_consent_ip" varchar(45);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "failed_login_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "tc_no_hash" text;--> statement-breakpoint
ALTER TABLE "clinic_encryption_keys" ADD CONSTRAINT "clinic_encryption_keys_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;