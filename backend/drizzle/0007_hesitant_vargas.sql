CREATE TABLE "doctor_availability_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clinic_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"date" date NOT NULL,
	"type" varchar(20) NOT NULL,
	"start_time" time,
	"end_time" time,
	"reason" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "doctor_availability_overrides_doctor_date_type_unique" UNIQUE("doctor_id","date","type")
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "domain" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" varchar(20);--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "doctor_availability_overrides" ADD CONSTRAINT "doctor_availability_overrides_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_availability_overrides" ADD CONSTRAINT "doctor_availability_overrides_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinics" ADD CONSTRAINT "clinics_domain_unique" UNIQUE("domain");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_clinic_id_unique" UNIQUE("email","clinic_id");