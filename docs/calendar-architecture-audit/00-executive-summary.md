# Calendar Architecture Audit: Executive Summary

## Scope
This document is a conclusion-first summary of the scheduling and calendar domain inside the clinic product. It is limited to scheduling-adjacent truth: route/auth entrypoints, doctor and staff scheduling surfaces, appointment and availability APIs, backend scheduling services, scheduling schema, and runtime evidence behind the current `Programım` failure.

## Proven
- The current `Programım` failure is a runtime schema-truth issue, not a missing-calendar-library issue.
- The doctor schedule boot path is:
  - `src/App.tsx` route `/doctor/schedule`
  - `src/pages/doctor/DoctorSchedule.tsx`
  - `src/components/calendar/DoctorCalendar.tsx`
  - `src/services/api.ts` `api.availabilityOverrides.listByDoctor(...)`
  - `backend/src/availability-overrides/availability-overrides.controller.ts`
  - `backend/src/availability-overrides/availability-overrides.service.ts`
  - runtime query against table `doctor_availability_overrides`
- The live API throws `relation "doctor_availability_overrides" does not exist` while rendering the calendar.
- The running database currently contains `appointments`, `doctor_availability`, `doctors`, `patients`, and `users`, but does not contain `doctor_availability_overrides` or `patient_clinical_notes`.
- Scheduling truth is fragmented across three separate persistence models instead of one scheduling core:
  - recurring weekly availability in `doctor_availability`
  - date-specific exceptions in `doctor_availability_overrides`
  - appointment lifecycle in `appointments`
- Current booking and scheduling logic is not centralized. `AvailabilityService`, `AvailabilityOverridesService`, and `AppointmentsService` each own part of the model, and no single layer enforces slot validity, overlap, inactive-doctor blocking, or end-to-end lifecycle rules.
- The current frontend stack is already capable of a Google-Calendar-inspired internal scheduler shell:
  - `react-big-calendar` in `src/components/calendar/DoctorCalendar.tsx`
  - `react-day-picker` via `src/components/ui/calendar.tsx`
  - `date-fns` across calendar and booking surfaces
  - no drag/drop addon is wired today
- Current blockers for a truthful scheduling product are:
  - runtime schema drift
  - inconsistent status vocabulary
  - timezone-naive date handling
  - incomplete inactive-doctor safety

## Inferred
- Replacing the calendar library now would not fix the primary failure path.
- The frontend already implies a richer scheduling model than the backend enforces. The doctor calendar renders availability, overrides, and appointments in one surface, but those concepts are still owned by separate services with incomplete invariants.
- Staff and doctor surfaces depend on overlapping but different read models:
  - doctor surface uses `DoctorCalendar` plus doctor-specific appointment views
  - staff surface uses appointment queues and ad hoc per-doctor availability summaries
- If implementation starts from visuals first, the likely result is fake richness: drag/resize interactions on top of backend truth that still cannot authoritatively reject overlap, inactive-doctor booking, or status misuse.

## Unknown
- Why the live database schema diverged from repo schema and migration metadata.
- Whether the drift came from skipped baseline application, partial container init, or manual database setup.
- Whether product wants to keep `staff` as the secretary-equivalent role name or split it into a dedicated `secretary` role later.
- The final clinic-local timezone policy for persisted appointment boundaries and day bucketing.

## Concrete repo/runtime evidence
- Frontend doctor schedule entry:
  - `src/App.tsx`
  - `src/pages/doctor/DoctorSchedule.tsx`
  - `src/components/auth/RequireDoctorAccess.tsx`
- Calendar read model composition:
  - `src/components/calendar/DoctorCalendar.tsx`
  - `src/types/calendar.ts`
  - `src/utils/calendarUtils.ts`
- API client methods:
  - `src/services/api.ts` `api.availability.listByDoctor`
  - `src/services/api.ts` `api.availability.getDoctorSlots`
  - `src/services/api.ts` `api.availabilityOverrides.listByDoctor`
  - `src/services/api.ts` `api.appointments.list`
  - `src/services/api.ts` `api.appointments.create`
  - `src/services/api.ts` `api.appointments.updateStatus`
- Backend scheduling services:
  - `backend/src/availability/availability.service.ts`
  - `backend/src/availability-overrides/availability-overrides.service.ts`
  - `backend/src/appointments/appointments.service.ts`
- Scheduling schema and migrations:
  - `backend/src/database/schema/doctor-availability.schema.ts`
  - `backend/src/database/schema/doctor-availability-overrides.schema.ts`
  - `backend/src/database/schema/appointments.schema.ts`
  - `backend/drizzle/0007_hesitant_vargas.sql`
  - `backend/drizzle/0008_bent_wrecking_crew.sql`
  - `backend/drizzle/baseline_existing_db.sql`
  - `backend/drizzle/meta/_journal.json`
- Runtime evidence gathered during this audit:
  - `docker logs clinic_api` shows repeated `DrizzleQueryError` for missing `doctor_availability_overrides`
  - `docker logs clinic_api` also shows missing `patient_clinical_notes`
  - `docker exec clinic_db psql -U clinic_user -d clinic_db ...` showed:
    - existing tables: `appointments`, `doctor_availability`, `doctors`, `patients`, `users`
    - missing tables from the queried set: `doctor_availability_overrides`, `patient_clinical_notes`
    - row counts: `doctors = 10`, `doctor_availability = 0`, `appointments = 0`

## Implication for next phase
Implementation should start from truth and stability, not interaction polish:
1. Align runtime schema with repo scheduling schema.
2. Stabilize scheduling-core invariants: overlap, slot validity, inactive-doctor exclusion, lifecycle enforcement.
3. Stabilize permissions and scheduling read models across doctor, staff, admin, and patient.
4. Build the internal calendar shell on the existing stack.
5. Add create/edit flows for availability, overrides, and appointments.
6. Add drag-select, drag-move, and resize only after server truth can safely validate and reject changes.
