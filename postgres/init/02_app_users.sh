#!/bin/bash
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  -- app_user: DML only (runtime)
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'app_user') THEN
      CREATE ROLE app_user WITH LOGIN PASSWORD '$APP_DB_PASSWORD';
    END IF;
  END
  \$\$;
  GRANT CONNECT ON DATABASE $POSTGRES_DB TO app_user;
  GRANT USAGE ON SCHEMA public TO app_user;

  -- migration_user: full DDL (drizzle-kit only)
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'migration_user') THEN
      CREATE ROLE migration_user WITH LOGIN PASSWORD '$MIGRATION_DB_PASSWORD' SUPERUSER;
    END IF;
  END
  \$\$;
  GRANT CONNECT ON DATABASE $POSTGRES_DB TO migration_user;

  -- Any table migration_user creates → app_user automatically gets DML
  ALTER DEFAULT PRIVILEGES FOR ROLE migration_user IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
  ALTER DEFAULT PRIVILEGES FOR ROLE migration_user IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO app_user;

  -- Any table migration_user creates → audit_user automatically gets INSERT on audit_logs
  -- (audit_user specific grant is handled post-migration via 03_audit_grants.sh)
EOSQL
