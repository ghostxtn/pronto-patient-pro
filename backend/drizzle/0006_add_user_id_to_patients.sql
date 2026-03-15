ALTER TABLE "patients"
ADD COLUMN IF NOT EXISTS "user_id" uuid;
--> statement-breakpoint
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
