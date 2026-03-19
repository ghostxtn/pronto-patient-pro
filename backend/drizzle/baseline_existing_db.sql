CREATE SCHEMA IF NOT EXISTS drizzle;

CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id serial PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint NOT NULL
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone varchar(20);
ALTER TABLE "patients"
ADD COLUMN IF NOT EXISTS "user_id" uuid;

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
