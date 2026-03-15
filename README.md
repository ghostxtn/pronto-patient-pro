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

Recommended flow

1. Copy `.env.example` to `.env` and fill in the secrets.
2. Install dependencies:
   - `npm install`
   - `npm run backend:install`
3. Start infrastructure:
   - `npm run db:up`
4. Apply database migrations:
   - `npm run db:migrate`
5. Seed the minimum tenant data:
   - `npm run db:seed`

Useful commands

- `npm run db:generate`: generate a new Drizzle migration from schema changes.
- `npm run db:migrate`: apply committed SQL migrations to the database.
- `npm run db:push`: push the current schema directly to the database without generating a migration.
- `npm run db:seed`: create the default clinics, owner/admin/doctor/patient accounts, and specializations for local development.
- `npm run backend:dev`: start the NestJS backend in watch mode.

If a teammate pulls new backend schema changes later, they should run `npm run db:migrate` again.

Existing database repair flow

Use this only if your local PostgreSQL already has the clinic tables but `npm run db:migrate` fails with errors like `relation "users" already exists`.

This means the database schema exists, but Drizzle migration history is missing or incomplete.

Repair steps

1. Make sure PostgreSQL is running:
   - `npm run db:up`
2. Apply the baseline repair script:
   - `Get-Content .\backend\drizzle\baseline_existing_db.sql -Raw | docker compose exec -T postgres psql -U clinic_user -d clinic_db`
3. Restart the backend:
   - `npm run backend:dev`
4. After this, future schema changes can use the normal flow again:
   - `npm run db:migrate`

What the repair script does

- Creates `drizzle.__drizzle_migrations` if it does not exist.
- Marks migrations `0000` through `0005` as already applied, only if they are missing.
- Adds `users.phone` if it is missing.

Important

- Use the repair script only for an existing local database that already contains the clinic tables.
- Do not use it as the default setup for a brand new empty database.
- For a fresh database, keep using:
  - `npm run db:migrate`
  - `npm run db:seed`

Local seed accounts

- `test-klinik.localhost`
- Owner: `owner@testklinik.local` / `Owner123!`
- Admin: `admin@testklinik.local` / `Admin123!`
- Doctor: `doctor@testklinik.local` / `Doctor123!`
- Patient: `patient@testklinik.local` / `Patient123!`

- `yeni-klinik.localhost`
- Owner: `owner@yeniklinik.local` / `Owner123!`
- Admin: `admin@yeniklinik.local` / `Admin123!`
- Doctor: `doctor@yeniklinik.local` / `Doctor123!`
- Patient: `patient@yeniklinik.local` / `Patient123!`
