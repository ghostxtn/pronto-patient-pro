# Calendar Architecture Audit: Failure Trace and Root-Cause Hypotheses

## Scope
This document traces the current `Programım` calendar failure from route entry to backend data access, separates proven facts from inferred risks, ranks root-cause hypotheses, and records what remains unknown.

## Proven
### Failure path
1. `src/App.tsx` registers `/doctor/schedule` under `RequireDoctorAccess`.
2. `src/pages/doctor/DoctorSchedule.tsx` loads the current doctor row by calling `api.doctors.list()` and matching `user_id` to the logged-in user.
3. `DoctorSchedule` renders `DoctorCalendar` with `doctorId={doctorRecord.id}`.
4. `src/components/calendar/DoctorCalendar.tsx` performs a `Promise.all(...)` for:
   - `api.availabilityOverrides.listByDoctor(doctorId, date_from, date_to)`
   - `api.appointments.list({ doctor_id, date_from, date_to })`
5. `src/services/api.ts` maps `availabilityOverrides.listByDoctor(...)` to `GET /availability-overrides?doctor_id=...&date_from=...&date_to=...`.
6. `backend/src/availability-overrides/availability-overrides.controller.ts` routes that request to `AvailabilityOverridesService.listByDateRange(...)`.
7. `backend/src/availability-overrides/availability-overrides.service.ts` queries `doctorAvailabilityOverrides`.
8. The runtime database does not contain table `doctor_availability_overrides`.
9. The thrown database error bubbles back, causing `DoctorCalendar` to render its error alert:
   - title: `Takvim yuklenemedi`
   - description: backend error message

### Primary failure cause
- Runtime logs from `docker logs clinic_api` show repeated `DrizzleQueryError` with:
  - query against `doctor_availability_overrides`
  - cause: `relation "doctor_availability_overrides" does not exist`
- Runtime database inspection via `docker exec clinic_db psql -U clinic_user -d clinic_db ...` confirmed that:
  - present: `appointments`, `doctor_availability`, `doctors`, `patients`, `users`
  - missing: `doctor_availability_overrides`, `patient_clinical_notes`
- Repo schema and migrations still expect `doctor_availability_overrides` to exist:
  - schema declaration in `backend/src/database/schema/doctor-availability-overrides.schema.ts`
  - migration creation in `backend/drizzle/0007_hesitant_vargas.sql`
  - baseline creation in `backend/drizzle/baseline_existing_db.sql`
  - snapshot/journal metadata under `backend/drizzle/meta`

### Adjacent proven breakage
- Runtime logs also show repeated `relation "patient_clinical_notes" does not exist`.
- `src/components/appointments/AppointmentDetailSheet.tsx` loads clinical notes via `api.clinicalNotes.listByPatient(...)`.
- The repo schema and migrations expect `patient_clinical_notes` to exist:
  - `backend/src/database/schema/patient-clinical-notes.schema.ts`
  - `backend/drizzle/0008_bent_wrecking_crew.sql`
  - `backend/drizzle/baseline_existing_db.sql`

## Inferred
### Ranked hypotheses
1. Missing `doctor_availability_overrides` table in the runtime database
   - Confidence: 0.99
   - Why: route trace, service trace, runtime query error, and live table list all line up.
   - Impact: blocks doctor and staff calendar surfaces that depend on `DoctorCalendar`.

2. Additional schema drift around `patient_clinical_notes`
   - Confidence: 0.95
   - Why: runtime logs prove the table is missing, and appointment detail UI tries to load it.
   - Impact: adjacent doctor-workspace break, especially appointment detail / patient history.

3. Migration metadata and live schema are out of sync
   - Confidence: 0.9
   - Why: repo migrations and Drizzle metadata include the missing tables, but live DB does not.
   - Impact: future implementation could trust migration history incorrectly and ship on top of a broken runtime baseline.

4. Even after restoring the missing table, scheduling behavior still has backend truth gaps
   - Confidence: 0.85
   - Why:
     - `AppointmentsService.create(...)` inserts appointments without availability or overlap checks.
     - `DoctorProfile.tsx` derives `endTime` with a hard-coded 30-minute add.
     - `UpdateStatusDto` allows `scheduled`, while main doctor/admin UIs do not expose it.
     - inactive-doctor prevention is inconsistent across discovery, auth, and booking surfaces.
   - Impact: table restoration alone may stop the crash but still leave an unsafe scheduling core.

5. Timezone/day-boundary bugs are likely latent, not yet the primary crash
   - Confidence: 0.7
   - Why:
     - `AvailabilityService.getBookableSlots(...)` uses `new Date(\`${date}T00:00:00\`).getDay()`
     - frontend uses local `Date`, `parseISO`, `toISOString`, and `date-fns`
   - Impact: future slot mismatches and off-by-one-day behavior are plausible, especially around timezone normalization.

## Unknown
- Why the runtime schema drift exists:
  - partial migration application
  - baseline script not executed
  - manual database bootstrap
  - old volume reuse
  - another deployment/setup path outside the repo
- Whether any environments besides the current runtime have the same missing tables.
- Whether restoring the missing tables will uncover more scheduling-specific drift immediately afterward.
- Whether there are active users depending on the currently accepted but weak appointment creation rules.

## Concrete repo/runtime evidence
- Route and component boot:
  - `src/App.tsx`
  - `src/pages/doctor/DoctorSchedule.tsx`
  - `src/components/calendar/DoctorCalendar.tsx`
- API client:
  - `src/services/api.ts` `api.availabilityOverrides.listByDoctor`
- Backend endpoint and service:
  - `backend/src/availability-overrides/availability-overrides.controller.ts`
  - `backend/src/availability-overrides/availability-overrides.service.ts`
- Missing-table schema and migration expectation:
  - `backend/src/database/schema/doctor-availability-overrides.schema.ts`
  - `backend/drizzle/0007_hesitant_vargas.sql`
  - `backend/drizzle/baseline_existing_db.sql`
  - `backend/drizzle/meta/_journal.json`
- Adjacent clinical-notes expectation:
  - `backend/src/database/schema/patient-clinical-notes.schema.ts`
  - `backend/drizzle/0008_bent_wrecking_crew.sql`
- Runtime evidence collected during audit:
  - `docker logs clinic_api`:
    - `relation "doctor_availability_overrides" does not exist`
    - `relation "patient_clinical_notes" does not exist`
  - `docker exec clinic_db psql -U clinic_user -d clinic_db ...`:
    - existing tables: `appointments`, `doctor_availability`, `doctors`, `patients`, `users`
    - row counts: `doctors = 10`, `doctor_availability = 0`, `appointments = 0`

## Implication for next phase
The next coding phase should treat runtime schema alignment as a hard prerequisite. Do not redesign the calendar UI first. The minimum safe order is:
1. restore runtime scheduling tables so the current calendar can boot
2. re-verify scheduling read paths end to end
3. then address backend invariants that the current UI already assumes but the backend does not enforce

Without that sequence, the team risks masking a schema-truth problem under UI work and then shipping a richer calendar on top of invalid scheduling rules.
