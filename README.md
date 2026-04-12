fast open with precommands :

docker compose down
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
$env:VITE_PROXY_TARGET="http://localhost"
npm run dev

Local Tenant Development

This project uses domain-based tenant resolution.

Each clinic is mapped to a domain stored in the clinics.domain column.

For local development we use .localhost subdomains.

Example clinic mappings
test-klinik.localhost
yeni-klinik.localhost
Access the frontend
http://test-klinik.localhost:5173
http://yeni-klinik.localhost:5173
Backend tenant resolution

The backend reads the request host and resolves the clinic:

Host → normalize → lookup clinics.domain

Normalization rules:

lowercase

remove port

exact match

Example:

test-klinik.localhost:5173 → test-klinik.localhost

Database setup for the team

The Drizzle schema and SQL migration files are tracked in git under `backend/src/database/schema` and `backend/drizzle`.

After `git pull`, the missing step is applying those migrations to the local PostgreSQL instance. Pulling the repo does not create tables automatically.

Recommended flow for a fresh database

1. Copy `.env.example` to `.env` and fill in the secrets.
   Add SMTP settings for email OTP delivery and password reset emails:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`
   - Optional: `SMTP_SECURE=true` for SMTPS providers
   - `FRONTEND_URL` for fallback auth email links when the request origin is unavailable
   - Optional: `PASSWORD_RESET_TTL_MINUTES` to override the default reset-link lifetime of 60 minutes
2. Install dependencies:
   - `npm install`
   - `npm run backend:install`
3. Start the Docker services:
   - `npm run dev:up`    # starts all services + opens postgres:5432 for migrations
   - `npm run dev:down`  # stops all services
   > ⚠️ Production deploy: use `npm run prod:up` — postgres port is NOT exposed
   - Before first startup on a fresh machine, make sure the Postgres init script is executable:
     - `chmod +x postgres/init/01_audit_user.sh`
4. Apply database migrations:
   - `npm run db:migrate`
   - Migrations that run from the host require `docker-compose.dev.yml` to be active so PostgreSQL is exposed on `5432`
5. Seed the minimum tenant data:
   - `npm run db:seed`

Useful commands

- `npm run db:generate`: generate a new Drizzle migration from schema changes.
- `npm run db:migrate`: apply committed SQL migrations to the database.
- `npm run db:push`: push the current schema directly to the database without generating a migration.
- `npm run db:seed`: create or update the default clinics, owner/admin/doctor/staff/patient accounts, and specializations for local development.
- `npm run dev:up`: start the Docker services for local development, including host Postgres access on `5432`.
- `npm run dev:down`: stop the local development Docker services.

If a teammate pulls new backend schema changes later, they should run `npm run db:migrate` again.

Audit logging DB notes

- `.env` must include `AUDIT_DB_PASSWORD` because Docker creates the `audit_user` role during Postgres initialization.
- The API uses `AUDIT_DATABASE_URL` for `AuditService`, separate from the main `DATABASE_URL`.
- `postgres/init/01_audit_user.sh` only creates the `audit_user` role and grants database/schema access.
- Table-level `audit_logs` grants are applied by migration `backend/drizzle/0016_audit_user_grants.sql`.
- If you need the init script to re-run locally, you must recreate the Postgres volume.

Postgres port note

- `docker-compose.yml` does not expose PostgreSQL directly.
- Host Postgres access lives in `docker-compose.dev.yml` only.
- For local Drizzle migrations and direct DB access from the host, start Compose with both files:
  - `npm run dev:up`
- To stop the local stack again:
  - `npm run dev:down`
- Production deploy:
  - `npm run prod:up`
- Do not use `docker-compose.dev.yml` in production.

Drizzle env note

- `backend/drizzle.config.ts` no longer loads `dotenv` itself.
- Drizzle commands rely on `node --env-file=../.env ...`, so run them through the existing package scripts.

Migration quick decision guide

- Fresh empty database: run `npm run db:migrate`, then `npm run db:seed`.
- Existing database with valid Drizzle history (for example already applied through `0007`): run `npm run db:migrate` only. Drizzle will apply the missing migrations such as `0008` and `0009`.
- Existing database where tables already exist but migration history is missing or broken: use the repair flow with `baseline_existing_db.sql`, then run `npm run db:migrate`.
- Existing database where you want the local demo account passwords reset to the README values: run `npm run db:seed`.

Existing database repair flow

Use this only if your local PostgreSQL already has the clinic tables but `npm run db:migrate` fails with errors like `relation "users" already exists`.

This means the database schema exists, but Drizzle migration history is missing or incomplete.

Repair steps

1. Make sure the Docker services are running:
   - `npm run dev:up`
2. Apply the baseline repair script:
   - `Get-Content .\backend\drizzle\baseline_existing_db.sql -Raw | docker compose exec -T postgres psql -U clinic_user -d clinic_db`
3. Apply any remaining committed migrations:
   - `npm run db:migrate`
4. Seed the minimum tenant data if needed:
   - `npm run db:seed`
5. Restart the backend container if needed:
   - `docker compose restart api`

What the repair script does

- Creates `drizzle.__drizzle_migrations` if it does not exist.
- Applies the idempotent schema repairs needed for the older existing local database, including the schema changes covered by `0007`, `0008`, and `0009`.
- Marks migrations `0000` through `0009` as already applied, only if they are missing.

Important

- Use the repair script only for an existing local database that already contains the clinic tables.
- Do not use it as the default setup for a brand new empty database.
- The baseline repair script is not a substitute for `npm run db:migrate`.
- The baseline repair script includes the equivalent of migrations `0000` through `0009`, but `npm run db:migrate` is still required for any remaining future migrations.
- For a fresh database, keep using:
  - `npm run db:migrate`
  - `npm run db:seed`

Local seed accounts

Running `npm run db:seed` also updates the existing demo users below to these passwords if they are already present in the local database.

- `test-klinik.localhost`
- Owner: `owner@testklinik.local` / `Password123!`
- Admin: `admin@testklinik.local` / `Password123!`
- Doctor: `doctor@testklinik.local` / `Password123!`
- Staff: `staff@testklinik.local` / `Password123!`
- Patient: `patient@testklinik.local` / `Password123!`

- `yeni-klinik.localhost`
- Owner: `owner@yeniklinik.local` / `Owner123!`
- Admin: `admin@yeniklinik.local` / `Admin123!`
- Doctor: `doctor@yeniklinik.local` / `Doctor123!`
- Patient: `patient@yeniklinik.local` / `Patient123!`

Rol	E-posta Adresi
👤 User	db7fe.user@inbox.testmail.app
🩺 Doktor	db7fe.doctor@inbox.testmail.app
🛠️ Staff	db7fe.staff@inbox.testmail.app
