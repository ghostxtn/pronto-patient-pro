ALTER TABLE "doctor_availability" ADD COLUMN "specific_date" date;--> statement-breakpoint
ALTER TABLE "doctor_availability" ALTER COLUMN "day_of_week" DROP NOT NULL;
