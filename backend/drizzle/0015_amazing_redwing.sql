ALTER TABLE "clinics" ADD COLUMN "default_appointment_duration" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "appointment_approval_mode" varchar(20) DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "max_booking_days_ahead" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "clinics" ADD COLUMN "cancellation_hours_before" integer DEFAULT 24 NOT NULL;