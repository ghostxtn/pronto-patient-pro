DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'appointments'
      AND column_name = 'reminder_sent_at'
  ) THEN
    ALTER TABLE "appointments" ADD COLUMN "reminder_sent_at" timestamp;
  END IF;
END $$;
