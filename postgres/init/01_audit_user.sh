#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'audit_user') THEN
      CREATE ROLE audit_user WITH LOGIN PASSWORD '$AUDIT_DB_PASSWORD';
    END IF;
  END
  \$\$;

  GRANT CONNECT ON DATABASE $POSTGRES_DB TO audit_user;
  GRANT USAGE ON SCHEMA public TO audit_user;
EOSQL
