# pronto-patient-pro Technical Documentation

# 1. Project Overview

## Source Files Inspected

- `package.json`
- `backend/package.json`
- `README.md`
- `docker-compose.yml`
- `docker-compose.dev.yml`
- `nginx/nginx.conf`
- `backend/src/app.module.ts`
- `backend/src/main.ts`
- `backend/src/database/schema/*.schema.ts`
- `backend/src/**/*.controller.ts`
- `backend/src/auth/**`
- `backend/src/common/**`
- `backend/drizzle/*.sql`

The task references `backend/src/db/schema/`; the schema files in this repository are under `backend/src/database/schema/`.

## System Summary

`pronto-patient-pro` is a multi-tenant clinic/patient management system. The frontend is a React/Vite application using Tailwind CSS and shadcn/Radix-style UI dependencies. The backend is a NestJS API using Drizzle ORM with PostgreSQL, Redis-backed auth/session state, Google OAuth, SMTP email delivery, audit logging, and AES-256-GCM encryption for selected patient/clinical data.

The API is globally prefixed with `/api` in `backend/src/main.ts`.

## Package Metadata

### Frontend

```text
name: vite_react_shadcn_ts
version: 0.0.0
private: true
type: module
```

Main frontend dependencies found in `package.json`:

```text
React 18.3.1
Vite 7.3.1
TypeScript 5.8.3
Tailwind CSS 3.4.17
Radix UI component primitives
React Router DOM 6.30.1
TanStack React Query 5.83.0
React Hook Form
Zod
Lucide React
Framer Motion
Recharts
Sonner
react-big-calendar
```

### Backend

```text
name: clinic-api
version: 1.0.0
```

Main backend dependencies found in `backend/package.json`:

```text
NestJS 11
@nestjs/config
@nestjs/jwt
@nestjs/passport
@nestjs/throttler
Drizzle ORM 0.45.1
drizzle-kit 0.31.9
PostgreSQL pg driver
ioredis
bcrypt
passport-jwt
passport-google-oauth20
helmet
multer
nodemailer
class-validator
class-transformer
```

## Multi-Tenancy Model

The project uses domain-based tenant resolution.

The tenant is resolved in `TenantMiddleware`:

```text
Host or trusted X-Forwarded-Host
  -> lowercase
  -> remove port
  -> in development, localhost/127.0.0.1/[::1] maps to test-klinik.localhost
  -> lookup clinics.domain
  -> attach request.tenant = { clinicId, clinic }
```

Only forwarded host headers from trusted loopback proxy addresses are accepted. If no clinic is found, the middleware throws `Clinic not found for this domain`.

`TenantGuard` then enforces that authenticated users cannot act across tenants by comparing:

```text
request.user.clinicId
request.tenant.clinicId
request.body.clinicId
clinic id path parameters for /clinics routes
```

# 2. Architecture

## Docker Services

Source: `docker-compose.yml`

| Service | Image / Build | Container | Ports | Volumes | Purpose |
|---|---|---|---|---|---|
| `postgres` | `postgres:16-alpine` | `clinic_db` | None in production compose | `postgres_data:/var/lib/postgresql/data`, `./postgres/init:/docker-entrypoint-initdb.d` | PostgreSQL database |
| `redis` | `redis:7-alpine` | `clinic_redis` | None | `redis_data:/data` | Redis for refresh tokens, OTP flows, OAuth codes |
| `api` | build `./backend` | `clinic_api` | Internal `3000` | `uploads_data:/app/uploads` | NestJS backend |
| `nginx` | build `./nginx` | `clinic_nginx` | `80:80` | None | Public HTTP entrypoint and reverse proxy |

`docker-compose.dev.yml` is development-only and exposes PostgreSQL on `127.0.0.1:5432:5432`. It also sets:

```text
NODE_ENV=development
APP_ENV=development
FRONTEND_URL=http://test-klinik.localhost
```

## Service Dependencies

```text
api depends on healthy postgres and redis
nginx depends on api
postgres and redis use health checks
all services join clinic_network
```

## Nginx Routing

Source: `nginx/nginx.conf`

Upstream:

```nginx
upstream api_upstream {
    server api:3000;
}
```

Routing rules:

| Location | Behavior |
|---|---|
| `/api/` | Proxies to `http://api_upstream/api/`, forwards `Host`, `X-Forwarded-Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`; adds `Cache-Control: no-store`. |
| `/uploads/(avatars|clinics|specializations)/` | Proxies to API and caches successful responses for 1 hour with public cache headers. |
| `/uploads/appointments/` | Returns `403 {"message":"Forbidden"}` directly from Nginx. |
| `/` | Returns `502 {"message":"Frontend not deployed yet"}`. |

Nginx also sets security headers, enables gzip for text/json/javascript/css, and limits request bodies to `10M`.

## Runtime Architecture Diagram

```text
                 HTTP :80
+-----------+    /api/*     +-------------+        internal :3000       +--------------+
|  Browser  | ----------->  | Nginx :80   | -------------------------> | NestJS API   |
+-----------+               +-------------+                            +------+-------+
                                                                                |
                                                        +-----------------------+-----------------------+
                                                        |                                               |
                                                +-------v--------+                              +-------v------+
                                                | PostgreSQL     |                              | Redis        |
                                                | postgres:5432  |                              | redis:6379   |
                                                +----------------+                              +--------------+
```

# 3. Database Schema

Source: `backend/src/database/schema/*.schema.ts`

## Multi-Tenant Tables

Tables with a `clinic_id` column:

```text
users
specializations
doctors
doctor_availability
doctor_availability_overrides
patients
appointments
appointment_notes
appointment_files
patient_clinical_notes
clinic_encryption_keys
audit_logs
trusted_devices
```

`clinics` is the tenant root table and does not itself have `clinic_id`.

## Encrypted Data

AES-256-GCM encryption is implemented in `backend/src/encryption/encryption.service.ts`.

Encryption model:

```text
ENCRYPTION_MASTER_KEY
  -> encrypts per-clinic DEK in clinic_encryption_keys.encrypted_dek
  -> per-clinic DEK encrypts selected patient/clinical fields
```

Columns with explicit `encrypted_` prefix:

```text
clinic_encryption_keys.encrypted_dek
```

Fields encrypted in-place by service/script usage:

```text
patients.first_name
patients.last_name
patients.tc_no
patients.phone
patients.email
patients.address
patient_clinical_notes.diagnosis
patient_clinical_notes.treatment
patient_clinical_notes.prescription
patient_clinical_notes.notes
appointment_notes.diagnosis
appointment_notes.treatment
appointment_notes.prescription
appointment_notes.notes
```

`patients.tc_no_hash` stores an HMAC-SHA256 hash derived from the per-clinic DEK.

## Table Definitions

### `clinics`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | primary key, default random |
| `name` | `varchar(255)` | not null |
| `slug` | `varchar(100)` | not null, unique |
| `domain` | `varchar(255)` | not null, unique |
| `logo_url` | `varchar(500)` | nullable |
| `default_appointment_duration` | `integer` | not null, default `30` |
| `appointment_approval_mode` | `varchar(20)` | not null, default `manual` |
| `max_booking_days_ahead` | `integer` | not null, default `60` |
| `cancellation_hours_before` | `integer` | not null, default `24` |
| `phone` | `varchar(20)` | nullable |
| `email` | `varchar(255)` | nullable |
| `address` | `text` | nullable |
| `is_active` | `boolean` | default `true` |
| `created_at` | `timestamp` | not null, default now |
| `updated_at` | `timestamp` | not null, default now |

### `users`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | primary key, default random |
| `email` | `varchar(255)` | not null |
| `password_hash` | `varchar(255)` | nullable |
| `first_name` | `varchar(100)` | not null |
| `last_name` | `varchar(100)` | not null |
| `phone` | `varchar(20)` | nullable |
| `role` | `varchar(20)` | not null, default `staff` |
| `clinic_id` | `uuid` | not null, FK `clinics.id` |
| `is_active` | `boolean` | default `true` |
| `google_id` | `varchar(255)` | nullable, unique |
| `avatar_url` | `varchar(500)` | nullable |
| `created_at` | `timestamp` | not null, default now |
| `updated_at` | `timestamp` | not null, default now |
| `kvkk_consent_at` | `timestamp` | nullable |
| `kvkk_consent_version` | `varchar(20)` | nullable |
| `kvkk_consent_ip` | `varchar(45)` | nullable |
| `failed_login_attempts` | `integer` | not null, default `0` |
| `locked_until` | `timestamp` | nullable |
| `password_reset_token_hash` | `varchar(255)` | nullable |
| `password_reset_expires_at` | `timestamp` | nullable |

Additional constraint:

```text
unique users_email_clinic_id_unique(email, clinic_id)
```

### `specializations`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | primary key, default random |
| `name` | `varchar(100)` | not null |
| `description` | `text` | nullable |
| `image_url` | `varchar(500)` | nullable |
| `clinic_id` | `uuid` | not null, FK `clinics.id` |
| `is_active` | `boolean` | default `true` |
| `created_at` | `timestamp` | not null, default now |
| `updated_at` | `timestamp` | not null, default now |

### `doctors`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | primary key, default random |
| `user_id` | `uuid` | not null, FK `users.id` |
| `specialization_id` | `uuid` | nullable, FK `specializations.id` |
| `clinic_id` | `uuid` | not null, FK `clinics.id` |
| `title` | `varchar(20)` | nullable |
| `bio` | `text` | nullable |
| `phone` | `varchar(20)` | nullable |
| `is_active` | `boolean` | default `true` |
| `created_at` | `timestamp` | not null, default now |
| `updated_at` | `timestamp` | not null, default now |

### `doctor_availability`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | primary key, default random |
| `doctor_id` | `uuid` | not null, FK `doctors.id` |
| `clinic_id` | `uuid` | not null, FK `clinics.id` |
| `day_of_week` | `integer` | nullable |
| `specific_date` | `date` | nullable |
| `start_time` | `time` | not null |
| `end_time` | `time` | not null |
| `slot_duration` | `integer` | not null, default `30` |
| `is_active` | `boolean` | default `true` |
| `created_at` | `timestamp` | not null, default now |
| `updated_at` | `timestamp` | not null, default now |

### `doctor_availability_overrides`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | primary key, default random |
| `clinic_id` | `uuid` | not null, FK `clinics.id`, on delete cascade |
| `doctor_id` | `uuid` | not null, FK `doctors.id`, on delete cascade |
| `date` | `date` | not null |
| `type` | `varchar(20)` | not null |
| `start_time` | `time` | nullable |
| `end_time` | `time` | nullable |
| `reason` | `varchar(255)` | nullable |
| `created_at` | `timestamp` | not null, default now |
| `updated_at` | `timestamp` | not null, default now |

### `patients`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | primary key, default random |
| `clinic_id` | `uuid` | not null, FK `clinics.id` |
| `user_id` | `uuid` | nullable, FK `users.id` |
| `first_name` | `text` | not null, encrypted in-place by service/script |
| `last_name` | `text` | not null, encrypted in-place by service/script |
| `tc_no` | `text` | nullable, encrypted in-place by service/script |
| `tc_no_hash` | `text` | nullable, HMAC for `tc_no` |
| `birth_date` | `date` | nullable |
| `gender` | `varchar(10)` | nullable |
| `phone` | `text` | nullable, encrypted in-place by service/script |
| `email` | `text` | nullable, encrypted in-place by service/script |
| `address` | `text` | nullable, encrypted in-place by service/script |
| `notes` | `text` | nullable |
| `is_active` | `boolean` | default `true` |
| `created_at` | `timestamp` | not null, default now |
| `updated_at` | `timestamp` | not null, default now |

### `appointments`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | primary key, default random |
| `clinic_id` | `uuid` | not null, FK `clinics.id` |
| `doctor_id` | `uuid` | not null, FK `doctors.id` |
| `patient_id` | `uuid` | not null, FK `patients.id` |
| `appointment_date` | `date` | not null |
| `start_time` | `time` | not null |
| `end_time` | `time` | not null |
| `status` | `varchar(20)` | not null, default `pending` |
| `type` | `varchar(50)` | nullable |
| `notes` | `text` | nullable |
| `reminder_sent_at` | `timestamp` | nullable |
| `created_at` | `timestamp` | not null, default now |
| `updated_at` | `timestamp` | not null, default now |

### `appointment_notes`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | primary key, default random |
| `appointment_id` | `uuid` | not null, FK `appointments.id` |
| `clinic_id` | `uuid` | not null, FK `clinics.id` |
| `doctor_id` | `uuid` | not null, FK `doctors.id` |
| `diagnosis` | `text` | nullable, encrypted in-place by service/script |
| `treatment` | `text` | nullable, encrypted in-place by service/script |
| `prescription` | `text` | nullable, encrypted in-place by service/script |
| `notes` | `text` | nullable, encrypted in-place by service/script |
| `created_at` | `timestamp` | not null, default now |
| `updated_at` | `timestamp` | not null, default now |

### `appointment_files`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | primary key, default random |
| `appointment_id` | `uuid` | not null, FK `appointments.id` |
| `clinic_id` | `uuid` | not null, FK `clinics.id` |
| `uploaded_by` | `uuid` | not null, FK `users.id` |
| `file_name` | `varchar(255)` | not null |
| `file_path` | `varchar(500)` | not null |
| `file_size` | `integer` | not null |
| `mime_type` | `varchar(100)` | not null |
| `created_at` | `timestamp` | not null, default now |

### `patient_clinical_notes`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | primary key, default random |
| `clinic_id` | `uuid` | not null, FK `clinics.id` |
| `patient_id` | `uuid` | not null, FK `patients.id`, on delete cascade |
| `doctor_id` | `uuid` | not null, FK `doctors.id`, on delete cascade |
| `appointment_id` | `uuid` | nullable, FK `appointments.id`, on delete set null |
| `diagnosis` | `text` | nullable, encrypted in-place by service/script |
| `treatment` | `text` | nullable, encrypted in-place by service/script |
| `prescription` | `text` | nullable, encrypted in-place by service/script |
| `notes` | `text` | nullable, encrypted in-place by service/script |
| `expires_at` | `timestamp` | nullable |
| `created_at` | `timestamp` | not null, default now |
| `updated_at` | `timestamp` | not null, default now |

### `clinic_encryption_keys`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | primary key, default random |
| `clinic_id` | `uuid` | not null, FK `clinics.id`, unique |
| `encrypted_dek` | `text` | not null, encrypted with `ENCRYPTION_MASTER_KEY` |
| `dek_version` | `integer` | not null, default `1` |
| `is_active` | `boolean` | not null, default `true` |
| `created_at` | `timestamp` | not null, default now |
| `rotated_at` | `timestamp` | nullable |

### `audit_logs`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | primary key, default random |
| `clinic_id` | `uuid` | not null, FK `clinics.id` |
| `user_id` | `uuid` | nullable, FK `users.id` |
| `user_role` | `varchar(20)` | nullable |
| `action` | `varchar(50)` | not null |
| `entity` | `varchar(50)` | not null |
| `entity_id` | `uuid` | nullable |
| `metadata` | `jsonb` | nullable |
| `ip_address` | `varchar(45)` | nullable |
| `request_id` | `uuid` | nullable |
| `created_at` | `timestamp` | not null, default now |

### `trusted_devices`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | primary key, default random |
| `user_id` | `uuid` | not null, FK `users.id` |
| `clinic_id` | `uuid` | not null, FK `clinics.id` |
| `token_hash` | `varchar(255)` | not null |
| `user_agent_hash` | `varchar(255)` | nullable |
| `expires_at` | `timestamp` | not null |
| `last_used_at` | `timestamp` | not null, default now |
| `created_at` | `timestamp` | not null, default now |
| `updated_at` | `timestamp` | not null, default now |

Indexes:

```text
unique index trusted_devices_token_hash_unique(token_hash)
index trusted_devices_user_id_idx(user_id)
index trusted_devices_clinic_id_idx(clinic_id)
```

# 4. API Endpoints

All paths below are shown with the global `/api` prefix. `Auth` values list endpoint-level decorators. Global guards are configured in `AppModule`: throttling, JWT auth, roles, tenant guard, and audit interceptor.

## Auth

Base route: `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | `@Public`, throttled | Register a tenant-scoped user and start/complete OTP flow as implemented by `AuthService.register`. |
| `POST` | `/api/auth/login` | `@Public`, throttled | Authenticate with email/password; may issue OTP challenge; sets refresh token cookie on success. |
| `POST` | `/api/auth/refresh` | `@Public` | Rotate a refresh token from the `refreshToken` cookie and return a new access token. |
| `POST` | `/api/auth/verify-otp` | `@Public`, throttled | Verify an auth OTP flow and issue tokens when successful. |
| `POST` | `/api/auth/resend-otp` | `@Public`, throttled | Resend OTP for an existing auth flow. |
| `POST` | `/api/auth/forgot-password` | `@Public`, throttled | Create a password reset token and send reset email. |
| `POST` | `/api/auth/reset-password` | `@Public`, throttled | Reset password with a reset token. |
| `POST` | `/api/auth/logout` | `@Public` | Clears the `refreshToken` cookie. |
| `GET` | `/api/auth/me` | `@UseGuards(JwtAuthGuard)`, `@Roles(owner, admin, doctor, staff, patient)` | Return the authenticated user. |
| `GET` | `/api/auth/google` | `@Public`, `@UseGuards(AuthGuard('google'))` | Start Google OAuth. |
| `POST` | `/api/auth/exchange-code` | `@Public` | Exchange a Redis-backed OAuth code for tokens. |
| `GET` | `/api/auth/google/callback` | `@Public`, `@UseGuards(AuthGuard('google'))` | Google OAuth callback; redirects to frontend callback URL. |

## Users / Profiles / Staff

Base routes: `/api/profiles`, `/api/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/profiles/me` | `@Audit(VIEW_PROFILE,user)`, `@Roles(owner, admin, doctor, staff, patient)` | Get current user's profile. |
| `PATCH` | `/api/profiles/me` | `@Audit(UPDATE_PROFILE,user)`, `@Roles(owner, admin, doctor, staff, patient)` | Update current user's profile. |
| `GET` | `/api/profiles` | `@Audit(LIST_USERS,user)`, `@Roles(owner, admin)` | List users in the current clinic. |
| `PATCH` | `/api/profiles/:id/role` | `@Audit(UPDATE_ROLE,user)`, `@Roles(owner)` | Update a user's role. |
| `GET` | `/api/users` | class `@Roles(owner)` | List staff users, optionally filtered by query. |
| `POST` | `/api/users` | class `@Roles(owner)`, `@Audit(CREATE_USER,user)` | Create a user via staff service. |
| `POST` | `/api/users/staff` | class `@Roles(owner)` | Create staff user. |
| `PATCH` | `/api/users/:id` | class `@Roles(owner)`, `@Audit(UPDATE_USER,user)` | Update staff/user fields. |
| `PATCH` | `/api/users/:id/status` | class `@Roles(owner)`, `@Audit(UPDATE_USER_STATUS,user)` | Set staff/user active status. |
| `DELETE` | `/api/users/:id` | class `@Roles(owner)`, `@Audit(DELETE_USER,user)` | Remove staff/user. |

## Clinics

Base route: `/api/clinics`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/clinics` | `@Roles(owner)` | Create clinic. |
| `GET` | `/api/clinics` | `@Roles(owner)` | List clinics visible from current clinic context. |
| `GET` | `/api/clinics/current` | `@Public` | Return current clinic resolved from tenant domain. |
| `GET` | `/api/clinics/:id` | `@Roles(owner, admin)` | Get clinic by id. |
| `PATCH` | `/api/clinics/:id` | `@Audit(UPDATE_CLINIC,clinic)`, `@Roles(owner, admin)` | Update clinic. |
| `PATCH` | `/api/clinics/:id/logo` | `@UseGuards(JwtAuthGuard,TenantGuard,RolesGuard)`, `@Audit(UPDATE_CLINIC_LOGO,clinic)`, `@Roles(owner)` | Upload and set clinic logo. |
| `DELETE` | `/api/clinics/:id` | `@Roles(owner)` | Soft-delete clinic. |

## Doctors

Base route: `/api/doctors`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/doctors/onboard` | `@Roles(owner, admin)` | Onboard a doctor. |
| `GET` | `/api/doctors/public-discovery` | `@Public` | Public doctor discovery for current tenant. |
| `GET` | `/api/doctors` | `@Roles(owner, admin, doctor, staff)` | List doctors in current clinic with optional filters. |
| `GET` | `/api/doctors/me` | `@Roles(owner, doctor)` | Get doctor profile for current user. |
| `GET` | `/api/doctors/:id` | `@Roles(owner, admin, doctor, staff, patient)` | Get doctor by id. |
| `PATCH` | `/api/doctors/:id` | `@Audit(UPDATE_DOCTOR,doctor)`, `@Roles(owner, admin)` | Update doctor. |
| `PATCH` | `/api/doctors/:id/admin` | `@Roles(admin)` | Admin-specific doctor update. |
| `PATCH` | `/api/doctors/:id/status` | `@Audit(UPDATE_DOCTOR_STATUS,doctor)`, `@Roles(admin)` | Admin sets doctor status. |
| `DELETE` | `/api/doctors/:id` | `@Audit(DELETE_DOCTOR,doctor)`, `@Roles(owner, admin)` | Soft-delete doctor. |

## Patients

Base route: `/api/patients`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/patients` | `@Audit(CREATE_PATIENT,patient)`, `@Roles(owner, admin, doctor, staff)` | Create patient in current clinic. |
| `GET` | `/api/patients` | `@Audit(LIST_PATIENTS,patient)`, `@Roles(owner, admin, doctor, staff)` | List patients in current clinic. |
| `GET` | `/api/patients/:id` | `@Audit(VIEW_PATIENT,patient)`, `@Roles(owner, admin, doctor, staff)` | Get patient by id. |
| `PATCH` | `/api/patients/:id` | `@Audit(UPDATE_PATIENT,patient)`, `@Roles(owner, admin, doctor, staff)` | Update patient. |
| `DELETE` | `/api/patients/:id` | `@Audit(DELETE_PATIENT,patient)`, `@Roles(owner, admin)` | Soft-delete patient. |

## Clinical Notes

Base route: `/api/clinical-notes`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/clinical-notes` | controller `@UseGuards(JwtAuthGuard,TenantGuard)`, `@Audit(LIST_CLINICAL_NOTES,clinical_note)`, `@Roles(owner, doctor)` | List clinical notes for a patient query. |
| `POST` | `/api/clinical-notes` | controller `@UseGuards(JwtAuthGuard,TenantGuard)`, `@Audit(CREATE_CLINICAL_NOTE,clinical_note)`, `@Roles(owner, doctor)` | Create clinical note. |
| `PATCH` | `/api/clinical-notes/:id` | controller `@UseGuards(JwtAuthGuard,TenantGuard)`, `@Audit(UPDATE_CLINICAL_NOTE,clinical_note)`, `@Roles(owner, doctor)` | Update clinical note. |
| `DELETE` | `/api/clinical-notes/:id` | controller `@UseGuards(JwtAuthGuard,TenantGuard)`, `@Audit(DELETE_CLINICAL_NOTE,clinical_note)`, `@Roles(owner, doctor)` | Delete clinical note. |

## Appointments

Base route: `/api/appointments`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/appointments` | `@Audit(CREATE_APPOINTMENT,appointment)`, `@Roles(owner, admin, doctor, staff, patient)` | Create appointment. |
| `GET` | `/api/appointments` | `@Audit(LIST_APPOINTMENTS,appointment)`, `@Roles(owner, admin, doctor, staff, patient)` | List appointments with optional filters. |
| `GET` | `/api/appointments/:id` | `@Audit(VIEW_APPOINTMENT,appointment)`, `@Roles(owner, admin, doctor, staff, patient)` | Get appointment by id. |
| `PATCH` | `/api/appointments/:id` | `@Audit(UPDATE_APPOINTMENT,appointment)`, `@Roles(owner, admin, doctor, staff)` | Update appointment. |
| `PATCH` | `/api/appointments/:id/status` | `@Audit(UPDATE_APPOINTMENT_STATUS,appointment)`, `@Roles(owner, admin, doctor, staff, patient)` | Update appointment status. |
| `DELETE` | `/api/appointments/:id` | `@Audit(DELETE_APPOINTMENT,appointment)`, `@Roles(owner, admin)` | Soft-delete appointment. |
| `POST` | `/api/appointments/:appointmentId/notes` | `@Audit(CREATE_APPOINTMENT_NOTE,appointment_note)`, `@Roles(doctor)` | Create appointment note. |
| `GET` | `/api/appointments/:appointmentId/notes` | `@Audit(LIST_APPOINTMENT_NOTES,appointment_note)`, `@Roles(owner, admin, doctor)` | List notes for appointment. |
| `PATCH` | `/api/appointments/notes/:noteId` | `@Audit(UPDATE_APPOINTMENT_NOTE,appointment_note)`, `@Roles(doctor)` | Update appointment note. |
| `DELETE` | `/api/appointments/notes/:noteId` | `@Audit(DELETE_APPOINTMENT_NOTE,appointment_note)`, `@Roles(owner, doctor)` | Delete appointment note. |

## Availability

Base routes: `/api/availability`, `/api/availability-overrides`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/availability/slots` | `@Public`, `@UseGuards(TenantGuard)`, throttled | Publicly list bookable slots for doctor/date in current tenant. |
| `POST` | `/api/availability` | `@Roles(owner, admin, doctor, staff)` | Create doctor availability. Doctors are forced to their own doctor profile. |
| `GET` | `/api/availability/:doctorId` | `@Roles(owner, admin, doctor, staff, patient)` | List availability for a doctor. |
| `PATCH` | `/api/availability/:id` | `@Roles(owner, admin, doctor, staff)` | Update availability; doctors can only modify their own. |
| `DELETE` | `/api/availability/:id` | `@Roles(owner, admin, doctor, staff)` | Remove availability; doctors can only modify their own. |
| `GET` | `/api/availability-overrides` | controller `@UseGuards(JwtAuthGuard,TenantGuard)`, `@Roles(owner, admin, doctor, staff)` | List overrides by required `doctor_id`, optionally with date range. |
| `POST` | `/api/availability-overrides` | controller `@UseGuards(JwtAuthGuard,TenantGuard)`, `@Roles(owner, admin, doctor, staff)` | Create availability override. |
| `PATCH` | `/api/availability-overrides/:id` | controller `@UseGuards(JwtAuthGuard,TenantGuard)`, `@Roles(owner, admin, doctor, staff)` | Update availability override. |
| `DELETE` | `/api/availability-overrides/:id` | controller `@UseGuards(JwtAuthGuard,TenantGuard)`, `@Roles(owner, admin, doctor, staff)` | Delete availability override. |

## Files / Storage

Base route: `/api/storage`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/storage/avatar` | `@Audit(UPLOAD_AVATAR,file)`, `@Roles(owner, admin, doctor, staff, patient)`, throttled | Upload avatar for current user. |
| `POST` | `/api/storage/avatar/:userId` | `@UseGuards(JwtAuthGuard,TenantGuard,RolesGuard)`, `@Audit(UPLOAD_AVATAR,file)`, `@Roles(owner, admin)`, throttled | Upload avatar for another user in same clinic. |
| `POST` | `/api/storage/appointments/:appointmentId/files` | `@Audit(UPLOAD_FILE,file)`, `@Roles(owner, admin, doctor)`, throttled | Upload appointment file. |
| `GET` | `/api/storage/appointments/:appointmentId/files` | `@Roles(owner, admin, doctor)`, throttled | List appointment files. |
| `GET` | `/api/storage/files/:fileId/download` | `@Audit(DOWNLOAD_FILE,file)`, `@Roles(owner, doctor, staff)`, throttled | Download file after service-level access check. |
| `DELETE` | `/api/storage/files/:fileId` | `@Audit(DELETE_FILE,file)`, `@Roles(owner, admin, doctor)` | Delete file. |

## Homepage / Public Discovery / Health

Base routes: `/api/homepage-preview`, `/api/specializations`, `/api/health`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/homepage-preview` | `@Public` | Return homepage preview data for current tenant. |
| `POST` | `/api/specializations` | `@Roles(owner, admin)` | Create specialization. |
| `GET` | `/api/specializations/public-discovery` | `@Public` | Public specialization discovery for current tenant. |
| `GET` | `/api/specializations` | `@Public` | List active specializations for current tenant. |
| `GET` | `/api/specializations/:id` | `@Public` | Get specialization by id for current tenant. |
| `PATCH` | `/api/specializations/:id` | `@Roles(owner, admin)` | Update specialization. |
| `PATCH` | `/api/specializations/:id/image` | `@UseGuards(JwtAuthGuard,TenantGuard,RolesGuard)`, `@Roles(owner, admin)` | Upload specialization image. |
| `DELETE` | `/api/specializations/:id` | `@Roles(owner, admin)` | Soft-delete specialization. |
| `GET` | `/api/health` | controller `@Public`, `@SkipThrottle` | Health check. |
| `GET` | `/api/health/ready` | controller `@Public`, `@SkipThrottle` | Readiness check. |

# 5. Authentication and Authorization

## Global Auth Pipeline

`AppModule` registers these global guards/interceptors:

```text
ThrottlerGuard
JwtAuthGuard
RolesGuard
TenantGuard
AuditInterceptor
```

`@Public()` bypasses `JwtAuthGuard` and is also treated as public by `TenantGuard`.

## JWT Access Tokens

Source: `backend/src/auth/auth.module.ts`, `backend/src/auth/strategies/jwt.strategy.ts`, `backend/src/auth/auth.service.ts`

Access token behavior:

```text
Signed with JWT_SECRET
Default TTL: JWT_EXPIRES_IN or 15m
Payload: { sub: userId, role, clinicId }
Extracted from Authorization: Bearer <token>
JwtStrategy reloads user by payload.sub and rejects inactive/missing users
Request user becomes { userId, role, clinicId }
```

## Refresh Tokens

Refresh token behavior:

```text
Signed with JWT_REFRESH_SECRET
Default JWT TTL: JWT_REFRESH_EXPIRES_IN or 7d
Stored as SHA-256 hash in Redis key refresh:{userId}
Redis TTL used by code: 604800 seconds
Cookie name: refreshToken
Cookie maxAge: 7 days
Refresh rotates token atomically with a Redis Lua script:
  read refresh:{userId}
  compare hashed incoming token
  delete old token
  generate and store new refresh token
```

## OTP Authentication

Source: `backend/src/auth/auth.service.ts`

OTP constants:

```text
OTP_LENGTH=6
OTP_TTL_SECONDS=600
OTP_MAX_ATTEMPTS=5
Redis key: auth:otp:{flowToken}
```

OTP flows are used for `login`, `register`, and `google` purposes. Codes are SHA-256 hashed before storing in Redis.

## Trusted Devices

Trusted device behavior:

```text
Cookie name: trusted_device_token
Default TTL: TRUSTED_DEVICE_TTL_DAYS or 30 days
Token hashes stored in trusted_devices.token_hash
User agent hash can be stored in trusted_devices.user_agent_hash
```

## Google OAuth Flow

Source: `backend/src/auth/strategies/google.strategy.ts`, `backend/src/auth/auth.controller.ts`

Flow:

```text
GET /api/auth/google
  -> Passport Google strategy
  -> scopes: email, profile
  -> callback URL: GOOGLE_CALLBACK_URL or http://localhost/api/auth/google/callback

GET /api/auth/google/callback
  -> GoogleStrategy.validate reads tenant from request.tenant
  -> calls AuthService.googleLogin with googleId, email, firstName, lastName, avatar
  -> callback redirects to tenant frontend:
       development: http://{clinic.domain}:5173/auth/callback
       production:  https://{clinic.domain}/auth/callback
  -> if OTP is required, redirects with requiresOtp=true, flowToken, email
```

`POST /api/auth/exchange-code` exchanges a Redis-backed `oauth_code:{code}` value for auth tokens.

## Roles

Roles used in decorators and auth logic:

```text
owner
admin
doctor
staff
patient
```

`RolesGuard` reads `@Roles(...)` metadata and checks `request.user.role`. If no role metadata exists, it allows the request.

## TenantGuard Behavior

`TenantGuard`:

```text
Allows @Public routes
Allows requests without request.user
Allows users without clinicId
Rejects /clinics/:id when :id differs from user.clinicId
Rejects request.body.clinicId when it differs from user.clinicId
Rejects request.tenant.clinicId when it differs from user.clinicId
Sets request.tenantId = user.clinicId
```

# 6. Environment Variables

Sources:

- `.env.example`
- `docker-compose.yml`
- `docker-compose.dev.yml`
- `backend/src/**/*.ts`
- `backend/drizzle.config.ts`

The checked-in `.env.example` only contains a subset of the variables used by the code and Compose files.

| Name | Required For Production | Description | Example |
|---|---:|---|---|
| `POSTGRES_USER` | Yes | PostgreSQL superuser used by container initialization. | `postgres` |
| `POSTGRES_PASSWORD` | Yes | PostgreSQL superuser password. | `***` |
| `POSTGRES_DB` | Yes | Database name. | `clinic_db` |
| `APP_DB_PASSWORD` | Yes | Password for `app_user`; API `DATABASE_URL` is built from it in Compose. | `***` |
| `MIGRATION_DB_PASSWORD` | Yes | Password for `migration_user`. | `***` |
| `AUDIT_DB_PASSWORD` | Yes | Password for `audit_user`; used to build `AUDIT_DATABASE_URL`. | `***` |
| `DATABASE_URL` | Yes | Main API PostgreSQL connection string. Compose sets this for the API container. | `postgresql://app_user:***@postgres:5432/clinic_db` |
| `AUDIT_DATABASE_URL` | Yes | Audit database connection string used by `AuditService`/`AUDIT_DRIZZLE`. Compose sets this for the API container. | `postgresql://audit_user:***@postgres:5432/clinic_db` |
| `MIGRATION_DATABASE_URL` | Yes for migrations | Drizzle migration connection string used by `backend/drizzle.config.ts`. | `postgresql://migration_user:***@localhost:5432/clinic_db` |
| `REDIS_PASSWORD` | Yes | Redis password used by the Redis container. | `***` |
| `REDIS_URL` | Yes | Redis connection URL used by API. Compose sets this for the API container. | `redis://:***@redis:6379` |
| `JWT_SECRET` | Yes | Access-token signing secret. `main.ts` requires at least 32 chars and rejects known weak values. | `***` |
| `JWT_REFRESH_SECRET` | Yes | Refresh-token signing secret. | `***` |
| `JWT_EXPIRES_IN` | Recommended | Access token TTL. Defaults to `15m`. | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Recommended | Refresh JWT TTL. Defaults to `7d`. Redis TTL is hard-coded to 604800 seconds. | `7d` |
| `ENCRYPTION_MASTER_KEY` | Yes | 64 hex character key for AES-256-GCM master encryption. | `***64-hex-chars***` |
| `NODE_ENV` | Yes | Runtime mode. Affects secure cookies, tenant localhost fallback, and frontend redirects. | `production` |
| `APP_ENV` | Recommended | App environment flag used by auth service development behavior. | `production` |
| `API_PORT` | Recommended | NestJS listen port. Defaults to `3000`. | `3000` |
| `CORS_ORIGIN` | Recommended | Static allowed frontend origin fallback. Defaults to `http://localhost:5173`. | `https://clinic.example.com` |
| `FRONTEND_URL` | Yes | Used for password reset links and fallback OAuth redirects. | `https://clinic.example.com` |
| `SMTP_HOST` | Yes for email features | SMTP server host. | `smtp.example.com` |
| `SMTP_PORT` | Recommended | SMTP port. Defaults to `587`. | `587` |
| `SMTP_USER` | Yes for email features | SMTP username. | `mailer@example.com` |
| `SMTP_PASS` | Yes for email features | SMTP password. | `***` |
| `SMTP_FROM` | Yes for email features | Verified sender address. | `Pronto <no-reply@example.com>` |
| `SMTP_SECURE` | Recommended | Whether to use SMTPS. Defaults to `false`. | `false` |
| `GOOGLE_CLIENT_ID` | Yes if Google auth enabled | Google OAuth client id; strategy throws if missing. | `***.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Yes if Google auth enabled | Google OAuth client secret; strategy throws if missing. | `***` |
| `GOOGLE_CALLBACK_URL` | Recommended if Google auth enabled | Google OAuth callback URL. Defaults to `http://localhost/api/auth/google/callback`. | `https://clinic.example.com/api/auth/google/callback` |
| `PASSWORD_RESET_TTL_MINUTES` | Optional | Password reset link lifetime. Defaults to `60`. | `60` |
| `TRUSTED_DEVICE_TTL_DAYS` | Optional | Trusted-device cookie/database expiry. Defaults to `30`. | `30` |
| `APPOINTMENT_REMINDER_ENABLED` | Optional | Enables/disables appointment reminder worker. Defaults to `true`. | `true` |
| `APPOINTMENT_REMINDER_INTERVAL_MINUTES` | Optional | Reminder worker interval. Defaults to `5`. | `5` |
| `APPOINTMENT_REMINDER_LEAD_HOURS` | Optional | Reminder lead time. Defaults to `24`. | `24` |
| `APPOINTMENT_REMINDER_WINDOW_MINUTES` | Optional | Reminder scan window. Defaults to `10`. | `10` |
| `SEED_PASSWORD` | Optional local/dev | Overrides default seed password in `backend/src/database/seed.ts`. | `Password123!` |

# 7. Development Setup

Source: `README.md`, `package.json`, `backend/package.json`, Compose files.

## Local Setup

1. Clone the repository.

```bash
git clone <repo-url>
cd pronto-patient-pro
```

2. Create `.env` from `.env.example` and fill in required secrets.

```bash
cp .env.example .env
```

3. Install dependencies.

```bash
npm install
npm run backend:install
```

4. Start local Docker services with the development override.

```bash
npm run dev:up
```

Equivalent command:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

5. Apply database migrations.

```bash
npm run db:migrate
```

6. Seed local data.

```bash
npm run db:seed
```

7. Start the frontend dev server.

```bash
npm run dev
```

The README notes tenant domains such as:

```text
http://test-klinik.localhost:5173
http://yeni-klinik.localhost:5173
```

## Useful Commands

```bash
npm run backend:dev
npm run backend:install
npm run dev
npm run dev:up
npm run dev:up:build
npm run dev:down
npm run dev:logs
npm run build
npm run lint
npm run test
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:seed
npm run prod:up
npm run prod:down
```

## Production Notes From README

```text
Use npm run prod:up for production.
Do not use docker-compose.dev.yml in production.
docker-compose.yml does not expose PostgreSQL directly.
docker-compose.dev.yml exposes PostgreSQL on localhost:5432 for local migrations/direct DB access.
```

# 8. Migration System

## Drizzle Configuration

Source: `backend/drizzle.config.ts`

```ts
export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.MIGRATION_DATABASE_URL!,
  },
});
```

Backend scripts:

```json
{
  "db:generate": "node --env-file=../.env ./node_modules/drizzle-kit/bin.cjs generate --config=drizzle.config.ts",
  "db:migrate": "node --env-file=../.env ./node_modules/drizzle-kit/bin.cjs migrate --config=drizzle.config.ts",
  "db:push": "node --env-file=../.env ./node_modules/drizzle-kit/bin.cjs push --config=drizzle.config.ts",
  "db:seed": "node --env-file=../.env -r ts-node/register ./src/database/seed.ts"
}
```

Root package scripts delegate to the backend:

```json
{
  "db:generate": "npm --prefix backend run db:generate",
  "db:migrate": "npm --prefix backend run db:migrate",
  "db:push": "npm --prefix backend run db:push",
  "db:seed": "npm --prefix backend run db:seed"
}
```

## Migration Workflow

Recommended committed migration workflow:

```bash
npm run db:generate
npm run db:migrate
```

Direct schema push workflow, available but not a substitute for committed migrations:

```bash
npm run db:push
```

The README describes `db:push` as pushing the current schema directly to the database without generating a migration.

## Migration Files

SQL migration files present in `backend/drizzle/`:

```text
0000_needy_matthew_murdock.sql
0001_mature_kulan_gath.sql
0002_overrated_fenris.sql
0003_ancient_mikhail_rasputin.sql
0004_tenant_domain_and_scoped_user_email.sql
0005_staff_phone_on_users.sql
0006_add_user_id_to_patients.sql
0007_hesitant_vargas.sql
0008_bent_wrecking_crew.sql
0009_chief_menace.sql
0010_cooing_exiles.sql
0011_daffy_lake.sql
0012_trusted_devices.sql
0013_salak_Hakan.sql
0014_awesome_cassandra_nova.sql
0015_amazing_redwing.sql
0016_audit_user_grants.sql
0017_lively_serpent_society.sql
0018_appointment_reminder_sent_at.sql
0019_ensure_appointment_reminder_sent_at.sql
baseline_existing_db.sql
```

`baseline_existing_db.sql` is documented in the README as a repair flow for existing local databases where tables already exist but Drizzle migration history is missing or broken. It is not the default setup for a fresh database.
