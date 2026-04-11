# pronto-patient-pro — CODEX Context

## Project Overview
Multi-tenant clinic management SaaS. Target market: small clinics (1-2 doctors) in Antalya, Turkey.
Single codebase, multiple clinic tenants. KVKK (Turkish data protection law) compliance is a hard requirement.

**AI Workflow:** Arda (product owner) → Claude (architect/reviewer) → Codex (code generation) → Claude (review)
Codex quota is limited — keep prompts minimal and targeted.

---

## Environment
- **OS:** Mac/zsh
- **Backend:** NestJS + Drizzle ORM + PostgreSQL + Redis
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + shadcn/ui + react-big-calendar
- **Auth:** JWT (15min access + 7day refresh, Redis-backed) + Google OAuth
- **Infrastructure:** Docker Compose + Nginx, Turkish VPS
- **Testing:** `curl` on Mac/zsh

## Graphify
- Knowledge graph output lives in `graphify-out/`
- Windows/PowerShell bootstrap command: `powershell -ExecutionPolicy Bypass -File .\scripts\graphify.ps1 bootstrap`
- Rebuild command after code changes: `powershell -ExecutionPolicy Bypass -File .\scripts\graphify.ps1 rebuild`
- Smoke test: `powershell -ExecutionPolicy Bypass -File .\scripts\graphify.ps1 smoke`
- The script is Windows-safe: it tries `py -3`, then `python3`, then `python`; forces UTF-8 to avoid CP1254 crashes; sets `PYTHONPATH` to `graphify-out/vendor`; and installs/updates `graphifyy` into `graphify-out/vendor` if imports are missing
- Do not use raw `python -c "from graphify..."` commands in this repo as the default workflow; future Codex sessions should always prefer the repo-local `scripts/graphify.ps1` runner

---

## Production & Local Routing

### Production model
1. `vite build` → static frontend served from web server/CDN
2. Clinic domains: `clinic-a.example.com`, `clinic-b.example.com` → frontend
3. `/api` and `/uploads` proxied to backend
4. Backend resolves tenant from request `Host` header → looks up `clinics.domain`

### Local development
- Working URL: `http://test-klinik.localhost:5173/`
- `http://test-klinik.localhost` (no port) → goes to nginx port 80 → returns 502 (frontend not deployed there)
- `http://localhost:5173/` works via fallback: frontend sends `test-klinik.localhost`, backend maps `localhost` → `test-klinik.localhost`
- Local tenant isolation is relaxed by design

---

## Multi-Tenancy
- Every table has `clinic_id` column, enforced via global `TenantGuard`
- Tenant resolved from `X-Forwarded-Host` / `Host` headers
- `clinics.domain`: VARCHAR 255, NOT NULL, UNIQUE
- User uniqueness: `UNIQUE(email, clinic_id)`

---

## Role System (single role per user)

| Role | Access |
|------|--------|
| `owner` | Admin view + context switcher to own doctor profile |
| `admin` | User management |
| `doctor` | Calendar, appointments, patient notes |
| `staff` | View doctor calendar + approve appointments |
| `patient` | Book appointments |

- Doctor profile is a **separate table** — a user can have a doctor profile regardless of role
- Owner with a doctor profile can switch to doctor view via context switcher UI

---

## Database Schema (11 tables)

| Table | Description |
|-------|-------------|
| `clinics` | Tenant info, domain column |
| `users` | Auth users, role-based |
| `specializations` | Doctor specializations |
| `doctors` | Doctor profiles |
| `doctor_availability` | Weekly recurring availability slots |
| `doctor_availability_overrides` | Date-specific overrides (blackout/custom_hours) |
| `patients` | Patient records |
| `appointments` | Appointments |
| `appointment_notes` | Legacy appointment notes |
| `appointment_files` | Appointment file uploads |
| `patient_clinical_notes` | Patient-scoped clinical notes (new system) |

### Migration History
- `0000–0006`: Base schema, auth, multi-tenancy, staff phone, patient user_id
- `0007`: `doctor_availability_overrides` table + domain/email unique constraints
- `0008`: `patient_clinical_notes` table
- `0012`: `trusted_devices` migration exists on mainline
- `0013_salak_Hakan`: drops `doctor_availability_overrides_doctor_date_type_unique` to allow same-day multiple `custom_hours` / block records under the new calendar scheduler flow

### Migration Flow
```bash
# Fresh local database
cp .env.example .env
npm install
npm run backend:install
docker compose up -d
npm run db:migrate
npm run db:seed
```

### Useful DB Commands
- `npm run db:generate` — generate a new Drizzle migration from schema changes
- `npm run db:migrate` — apply committed SQL migrations to the database
- `npm run db:push` — push current schema directly without generating a migration
- `npm run db:seed` — seed default clinics/users/specializations for local development
- `npm run db:up` — start postgres and redis only

### Recommended Workflow
- Fresh DB: `docker compose up -d` -> `npm run db:migrate` -> `npm run db:seed`
- Schema change: `npm run db:generate` -> commit migration -> `npm run db:migrate`
- Avoid treating `db:push` as the default team flow; prefer committed migrations

### Calendar Integration Note
- `calendar-integration` branch pulled the calendar scheduler from `origin/Calender_v5_fully-functionable` selectively, not as a full branch merge
- We intentionally did **not** take the branch's auth/i18n regressions
- The current scheduler UI is very close to the branch version:
  - `src/components/calendar/DoctorCalendar.tsx`
  - `src/index.css`
  - `src/pages/doctor/DoctorSchedule.tsx`
- The branch did **not** contain a true Google Calendar-style hover preview/popover in `DoctorCalendar`; current interactions are click/select based (`quick action`, `Sheet`, `Drawer`, `AppointmentDetailSheet`)
- If someone later asks "where did the hover modal go?", the answer is usually: it was not present in the committed branch/calendar code we integrated

### Staff Calendar 429 Note
- 429 root cause was per-doctor availability fan-out in `src/pages/staff/StaffDoctors.tsx`
- Final fix was removing the `Promise.all(...api.availability.listByDoctor...)` burst from the staff page
- Throttle `300/min` is kept only as buffer, not the primary solution

### Existing DB Repair Flow
Use this only if the local database already has clinic tables and `npm run db:migrate` fails with errors like `relation "users" already exists`.

```bash
docker compose up -d
Get-Content .\backend\drizzle\baseline_existing_db.sql -Raw | docker compose exec -T postgres psql -U clinic_user -d clinic_db
npm run db:migrate
npm run db:seed
docker compose restart api
```

- `baseline_existing_db.sql` is a repair script for existing local databases
- It is not a replacement for `npm run db:migrate`
- It currently covers baseline repair / migration marking through `0008`

### drizzle.config.ts
Requires `dotenv.config({ path: resolve(__dirname, '../.env') })` to read root `.env`.

---

## API Endpoints

### Auth
```
POST /api/auth/login
POST /api/auth/refresh
GET  /api/auth/me
```

### Availability
```
GET    /api/availability/:doctorId     — Returns ALL slots (no is_active filter)
POST   /api/availability               — camelCase DTO (see below)
PATCH  /api/availability/:id           — isActive supported
DELETE /api/availability/:id           — Hard delete (NOT soft delete)
```

### Availability Overrides
```
GET    /api/availability-overrides?doctor_id=&date_from=&date_to=
POST   /api/availability-overrides
PATCH  /api/availability-overrides/:id
DELETE /api/availability-overrides/:id
```

### Clinical Notes
```
GET    /api/clinical-notes?patient_id=   — All notes for patient, created_at DESC
POST   /api/clinical-notes               — snake_case DTO
PATCH  /api/clinical-notes/:id
DELETE /api/clinical-notes/:id
```

### Other
```
GET/POST/PATCH/DELETE /api/doctors
GET/POST/PATCH/DELETE /api/patients
GET/POST/PATCH/DELETE /api/appointments
PATCH /api/appointments/:id/status
GET/POST/PATCH/DELETE /api/appointment-notes
POST /api/storage/avatar
POST/GET /api/storage/appointments/:id/files
```

---

## Homepage File Map

### Route Entry
- Route: `src/App.tsx` içinde `path="/" element={<Landing />}`
- Page entry: `src/pages/Landing.tsx`
- Bootstrap chain: `index.html` -> `src/main.tsx` -> `src/App.tsx` -> `src/pages/Landing.tsx`

### Landing Composition
`src/pages/Landing.tsx` şu sırayla render eder:
- `src/components/landing/LandingNav.tsx`
- Custom split hero (page-local JSX, componentized değil)
- Specialty preview grid (page-local JSX, `previewData.specialties`)
- Doctor preview grid (page-local JSX, `previewData.doctors`)
- `src/components/landing/LandingFooter.tsx`

### Content And Data Sources
- Static homepage copy: `src/components/landing/content.ts`
- Dynamic homepage preview data: `src/hooks/useHomepagePreviewData.ts`
- Language state: `src/contexts/LanguageContext.tsx`

### Shared Homepage Dependencies
- `src/components/landing/SmartLink.tsx`
- `src/components/LanguageSwitcher.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/sonner.tsx`
- `src/components/ui/toaster.tsx`
- `src/components/ui/tooltip.tsx`
- `src/index.css`
- `tailwind.config.ts`

### Notes
- `src/components/landing/AnimatedCounter.tsx` aktif landing zincirinde kullanılmıyor.
- `src/components/landing/HeroSection.tsx` aktif landing zincirinde kullanılmıyor.
- `src/components/landing/HowItWorksSection.tsx` aktif landing zincirinde kullanılmıyor.
- `src/components/landing/SplitFeatureSection.tsx` aktif landing zincirinde kullanılmıyor.
- `src/components/landing/SpecializationsSection.tsx` aktif landing zincirinde kullanılmıyor.
- `src/components/landing/TestimonialsSection.tsx` aktif landing zincirinde kullanılmıyor.
- `src/components/landing/ContactBandSection.tsx` aktif landing zincirinde kullanılmıyor.
- `src/components/landing/CTASection.tsx` aktif landing zincirinde kullanılmıyor.
- Homepage'ten çıkan ana route'lar: `/request-appointment`, `/doctors`, `/specialties`, `/appointment-process`, `/contact`

### Current Homepage UI Notes
- Landing hero artık split-screen: sol panel açık zeminli metin + CTA, sağ panel gradient/glassmorphism doktor preview.
- `src/components/landing/LandingNav.tsx` mobil hamburger menü içeriyor; mobil drawer linkleri `SmartLink` `onClick` desteğini kullanıyor.
- `src/components/landing/SmartLink.tsx` artık `onClick` ve `style` prop'larını geçiriyor.
- `src/components/landing/LandingFooter.tsx` koyu footer gradient yerine açık mavi-yeşil gradient ve koyu metin kullanıyor; logo custom SVG.
- `src/App.tsx` içinde route transition için `AnimatePresence` kullanılıyor; landing/auth geçişleri motion wrapper ile animasyonlu.

---

## DTO Naming Rules (IMPORTANT)

| Module | Convention | Example |
|--------|-----------|---------|
| Availability | camelCase | `doctorId`, `dayOfWeek`, `startTime`, `endTime`, `slotDuration`, `isActive` |
| Clinical Notes | snake_case | `patient_id`, `doctor_id`, `appointment_id` |
| Update DTOs | No `doctorId` | Never send `doctorId` in PATCH requests |

---

## Availability System

### doctor_availability (weekly recurring)
- `day_of_week`: 0=Sunday, 1=Monday ... 6=Saturday
- `start_time`, `end_time`: stored as `HH:MM:SS` in DB
- `is_active`: toggleable
- Overlap validation: same doctor + same day + active slots cannot overlap
- DELETE is hard delete

### doctor_availability_overrides (date-specific)
- Old model assumed one override per `doctor_id + date + type`
- New scheduler model supports multiple same-day `custom_hours` / blocked ranges and merge logic in service layer
- Runtime coordination now lives in:
  - `backend/src/availability-overrides/availability-overrides.service.ts`
  - `findOverridesForDate(...)`
  - `ensureOverrideCompatibility(...)`
  - `findOverlappingCustomHours(...)`
  - `normalizeCustomHoursOverlap(...)`
- DB/schema must stay aligned with this model:
  - `backend/src/database/schema/doctor-availability-overrides.schema.ts` should **not** reintroduce the old unique constraint
  - `backend/drizzle/0013_salak_Hakan.sql` must be applied locally if DB still has `doctor_availability_overrides_doctor_date_type_unique`

### doctor_availability_overrides (date-specific)
- `type`: `blackout` | `custom_hours`
- `blackout`: `start_time` and `end_time` must be null
- `custom_hours`: `start_time` and `end_time` required
- Unique constraint: `(doctor_id, date, type)`

---

## Doctor Calendar System (react-big-calendar)

### Key Files
- `src/components/calendar/DoctorCalendar.tsx` — Main calendar component
- `src/components/calendar/AvailabilityModal.tsx` — Add/edit/delete availability slots
- `src/components/calendar/OverrideModal.tsx` — Add/edit/delete overrides
- `src/components/appointments/AppointmentDetailSheet.tsx` — Shared appointment detail (used in calendar + appointments page)
- `src/utils/calendarUtils.ts` — Event conversion helpers
- `src/types/calendar.ts` — Types: AvailabilitySlot, AvailabilityOverride, Appointment, ClinicalNote, CalendarEvent

### Calendar Behaviors
- Default view: `week`
- "Gün" button: always navigates to today
- Month view day click → drill down to day view
- Empty slot click (week/day) → AvailabilityModal create mode
- Green slot click → AvailabilityModal edit mode
- Appointment click → AppointmentDetailSheet
- Blackout click → Toast with reason
- Day header right-click → context menu (blackout / custom hours)
- Agenda view: fetches 30-day range

### Date Range by View
```
month  → startOfMonth → endOfMonth
week   → startOfWeek → endOfWeek (Monday start)
day    → same day
agenda → date → +30 days
```

### Color System (via slotPropGetter)
- Available hours: `#dcfce7` green background
- Blackout days: no green shown
- Appointments: blue event
- Blackout: red all-day banner
- Custom hours: yellow event

### Availability Sheet (in calendar toolbar)
- "Müsaitliği Yönet" button opens right-side Sheet
- Two sections: Haftalık Slotlar + İstisnalar
- Override list: last 30 days + next 365 days

---

## Patient Clinical Notes System

### patient_clinical_notes table
- Patient-scoped (NOT appointment-scoped)
- `appointment_id`: optional — which appointment it was written in
- `expires_at`: null for now — KVKK retention period pending legal consultation
- Fields: `diagnosis`, `treatment`, `prescription`, `notes` (all optional, at least one required)

### Frontend
- `AppointmentDetailSheet` has "Geçmiş Notlar" + "Yeni Not Ekle" sections
- `DoctorPatientDetail` page also shows full clinical note history
- `doctor_id` always taken from appointment object or auth context — never hardcoded

---

## Shared Components

| Component | Location | Used By |
|-----------|----------|---------|
| `AppointmentDetailSheet` | `src/components/appointments/` | DoctorCalendar, DoctorAppointments |
| `AvailabilityModal` | `src/components/calendar/` | DoctorCalendar |
| `OverrideModal` | `src/components/calendar/` | DoctorCalendar |
| `DoctorCalendar` | `src/components/calendar/` | DoctorSchedule |

---

## Completed Screens

### Doctor
- `/doctor/dashboard` — Stats cards (navigate to appointments/schedule)
- `/doctor/schedule` — Weekly calendar (react-big-calendar)
- `/doctor/appointments` — Appointment list with detail sheet
- `/doctor/patients` — Patient list with search
- `/doctor/patients/:id` — Patient detail: clinical notes + appointment history

### Admin/Owner
- Admin panel exists (user management)
- Owner has context switcher to doctor profile view

### Staff
- Staff screens exist (doctor calendar view + appointment approval)

### Patient
- Patient booking flow exists
- **Next: patient screens need review/improvement**

---

## Known Issues

### Firefox cursor issue
- `cursor: pointer` on react-big-calendar time slots doesn't work in Firefox
- `rbc-*` CSS selectors added but not effective
- To fix later: custom time slot wrapper component

### Firefox AM/PM display
- `<input type="time">` shows 12h format in Firefox based on system locale
- Values sent correctly as `HH:MM` — visual only
- To fix later: custom time picker component

---

## Production Gaps (TODO)

- [ ] Email notifications (critical) — appointment confirmation/cancellation/reminders
- [ ] Rate limiting (critical) — brute force protection on API
- [ ] Patient screens — review and improve
- [ ] UI polish — overall design improvements
- [ ] KVKK data retention cron job — pending legal consultation
