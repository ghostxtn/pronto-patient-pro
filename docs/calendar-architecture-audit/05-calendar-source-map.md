# Calendar Architecture Audit: Calendar Source Map

## Scope
This file is a single-pane map of the scheduling system. It is written for a human who wants to understand the whole calendar domain quickly without merging implementation files. It focuses on actual repo and runtime truth for routes, components, APIs, services, schema, roles, and change impact.

## Proven
### Frontend entrypoints
#### Routes
- `src/App.tsx`
  - `/patient/doctors/:id` -> `DoctorProfile`
  - `/patient/appointments` -> `MyAppointments`
  - `/doctor/schedule` -> `DoctorSchedule`
  - `/doctor/appointments` -> `DoctorAppointments`
  - `/doctor/patients/:id` -> `DoctorPatientDetail`
  - `/staff/dashboard` -> `StaffDashboard`
  - `/staff/doctors` -> `StaffDoctors`
  - `/admin/appointments` -> `ManageAppointments`

#### Pages
- `src/pages/DoctorProfile.tsx`: patient booking surface
- `src/pages/MyAppointments.tsx`: patient appointment list/cancel
- `src/pages/doctor/DoctorSchedule.tsx`: doctor schedule entrypoint
- `src/pages/doctor/DoctorAppointments.tsx`: doctor appointment list/detail/status update
- `src/pages/staff/StaffDashboard.tsx`: pending confirmations and today-summary operations
- `src/pages/staff/StaffDoctors.tsx`: staff doctor selector + reused `DoctorCalendar`
- `src/pages/admin/ManageAppointments.tsx`: admin appointment management table/dialog

#### Calendar components
- `src/components/calendar/DoctorCalendar.tsx`
  - central internal scheduling surface today
  - loads availability + overrides + appointments
  - mutates recurring availability and overrides
- `src/components/calendar/AvailabilityModal.tsx`
- `src/components/calendar/OverrideModal.tsx`

#### Related sheets/modals
- `src/components/appointments/AppointmentDetailSheet.tsx`
- `src/components/auth/RequireDoctorAccess.tsx`

#### Hooks/state/query usage
- Scheduling queries currently live directly in pages/components rather than a dedicated calendar data layer.
- Important query keys:
  - `["my-doctor-record", user?.id]`
  - `["availability", doctorId]`
  - `["doctor-calendar", doctorId, date_from, date_to, view]`
  - `["availability-overrides", doctorId, rangeStart, rangeEnd]`
  - `["doctor-appointments-list", doctorRecord?.id]`
  - `["staff-dashboard", today]`
  - `["clinical-notes", appointment?.patient.id]`
- State split today:
  - local component state: current date/view, selected appointment, modal open state, delete confirmations
  - server state: availability rows, override rows, appointments, clinical notes

#### Shared UI primitives
- `src/components/ui/calendar.tsx` wraps `react-day-picker`
- `src/components/ui/sheet.tsx`, `dialog.tsx`, `alert-dialog.tsx`, `dropdown-menu.tsx`, `badge.tsx`, `button.tsx`, `switch.tsx`, `select.tsx`
- `src/types/calendar.ts` defines shared scheduling data shapes
- `src/utils/calendarUtils.ts` turns appointments and overrides into `react-big-calendar` events

### API surface
#### Frontend API client methods
- `src/services/api.ts`
  - Availability:
    - `api.availability.listByDoctor`
    - `api.availability.getDoctorSlots`
    - `api.availability.create`
    - `api.availability.update`
    - `api.availability.remove`
  - Availability overrides:
    - `api.availabilityOverrides.listByDoctor`
    - `api.availabilityOverrides.create`
    - `api.availabilityOverrides.update`
    - `api.availabilityOverrides.remove`
  - Appointments:
    - `api.appointments.list`
    - `api.appointments.get`
    - `api.appointments.create`
    - `api.appointments.update`
    - `api.appointments.updateStatus`
    - `api.appointments.delete`
    - `api.appointments.notes.list/create/update/delete`
  - Clinical notes:
    - `api.clinicalNotes.listByPatient`
    - `api.clinicalNotes.create`
  - Doctors:
    - `api.doctors.list`
    - `api.doctors.get`
    - `api.doctors.me`

#### Endpoint paths
- Availability
  - `GET /availability/:doctorId`
  - `GET /availability/slots?doctor_id=...&date=...`
  - `POST /availability`
  - `PATCH /availability/:id`
  - `DELETE /availability/:id`
- Availability overrides
  - `GET /availability-overrides?doctor_id=...&date_from=...&date_to=...`
  - `POST /availability-overrides`
  - `PATCH /availability-overrides/:id`
  - `DELETE /availability-overrides/:id`
- Appointments
  - `GET /appointments`
  - `GET /appointments/:id`
  - `POST /appointments`
  - `PATCH /appointments/:id`
  - `PATCH /appointments/:id/status`
  - `DELETE /appointments/:id`
  - `GET /appointments/:appointmentId/notes`
  - `POST /appointments/:appointmentId/notes`
- Clinical notes
  - `GET /clinical-notes?patient_id=...`
  - `POST /clinical-notes`

#### Request/response DTOs actually relevant to scheduling
- `backend/src/availability/dto/create-availability.dto.ts`
- `backend/src/availability/dto/get-slots.dto.ts`
- `backend/src/availability-overrides/dto/create-availability-override.dto.ts`
- `backend/src/appointments/dto/create-appointment.dto.ts`
- `backend/src/appointments/dto/update-status.dto.ts`

### Backend entrypoints
#### Controllers
- `backend/src/availability/availability.controller.ts` -> `AvailabilityController`
- `backend/src/availability-overrides/availability-overrides.controller.ts` -> `AvailabilityOverridesController`
- `backend/src/appointments/appointments.controller.ts` -> `AppointmentsController`
- `backend/src/doctors/doctors.controller.ts` -> `DoctorsController`

#### Services
- `backend/src/availability/availability.service.ts` -> recurring availability + public slot generation
- `backend/src/availability-overrides/availability-overrides.service.ts` -> per-date override CRUD
- `backend/src/appointments/appointments.service.ts` -> appointment CRUD/status/notes
- `backend/src/doctors/doctors.service.ts` -> doctor discovery, activation, profile fetch

#### Direct DB access/query files
- Direct Drizzle access lives inside services rather than repository classes.
- Main query owners:
  - `AvailabilityService` -> `doctorAvailability`, `doctorAvailabilityOverrides`, `appointments`
  - `AvailabilityOverridesService` -> `doctorAvailabilityOverrides`, `doctors`
  - `AppointmentsService` -> `appointments`, `patients`, `doctors`, `users`, `appointmentNotes`
  - `DoctorsService` -> `doctors`, `users`, `specializations`

### Database truth
#### Schema files
- `backend/src/database/schema/doctor-availability.schema.ts`
- `backend/src/database/schema/doctor-availability-overrides.schema.ts`
- `backend/src/database/schema/appointments.schema.ts`
- `backend/src/database/schema/doctors.schema.ts`
- `backend/src/database/schema/patients.schema.ts`
- `backend/src/database/schema/users.schema.ts`
- Adjacent note tables:
  - `appointment-notes.schema.ts`
  - `patient-clinical-notes.schema.ts`

#### Migration files
- `backend/drizzle/0002_overrated_fenris.sql`
- `backend/drizzle/0007_hesitant_vargas.sql`
- `backend/drizzle/0008_bent_wrecking_crew.sql`
- `backend/drizzle/baseline_existing_db.sql`

#### Key tables and relations
- `doctor_availability`
  - FK -> `doctors`
  - recurring weekly schedule blocks
- `doctor_availability_overrides`
  - FK -> `doctors`
  - unique on `(doctor_id, date, type)`
  - date-specific blackout/custom-hours exceptions
- `appointments`
  - FK -> `doctors`
  - FK -> `patients`
  - appointment date + time + status + type + notes
- `doctors`
  - FK -> `users`
  - owns doctor activation and profile
- `patients`
  - optional FK -> `users`
- `users`
  - app identity and role

#### Live runtime drift notes
- Runtime currently has:
  - `appointments`
  - `doctor_availability`
  - `doctors`
  - `patients`
  - `users`
- Runtime is missing:
  - `doctor_availability_overrides`
  - `patient_clinical_notes`
- Runtime row counts observed during this audit:
  - `doctors = 10`
  - `doctor_availability = 0`
  - `appointments = 0`

### Role mapping
- Patient
  - touchpoints: `DoctorProfile`, `MyAppointments`
  - actions: view doctors, fetch slots, create appointment, cancel appointment
- Doctor
  - touchpoints: `DoctorSchedule`, `DoctorAppointments`, `DoctorPatientDetail`
  - actions: manage recurring availability, manage overrides, view appointments, complete appointments, see clinical history
- Staff-secretary
  - current role name in repo: `staff`
  - touchpoints: `StaffDashboard`, `StaffDoctors`
  - actions: confirm pending appointments, inspect doctor calendars, see doctor availability summaries
- Admin
  - touchpoints: `ManageAppointments`, doctor/staff management screens
  - actions: view all appointments, update status, manage doctor activation indirectly

### Runtime flow map
#### Doctor schedule boot
- `src/App.tsx` `/doctor/schedule`
- `src/components/auth/RequireDoctorAccess.tsx`
- `src/pages/doctor/DoctorSchedule.tsx`
- `src/components/calendar/DoctorCalendar.tsx`
- `src/services/api.ts`
  - `api.availability.listByDoctor`
  - `api.availabilityOverrides.listByDoctor`
  - `api.appointments.list`
- backend:
  - `AvailabilityController.findByDoctor`
  - `AvailabilityOverridesController.findAll`
  - `AppointmentsController.findAll`
- services/tables:
  - `AvailabilityService` -> `doctor_availability`
  - `AvailabilityOverridesService` -> `doctor_availability_overrides`
  - `AppointmentsService` -> `appointments`

#### Patient doctor-profile booking
- `src/App.tsx` `/patient/doctors/:id`
- `src/pages/DoctorProfile.tsx`
- `src/services/api.ts`
  - `api.doctors.get`
  - `api.availability.listByDoctor`
  - `api.availability.getDoctorSlots`
  - `api.appointments.create`
- backend:
  - `DoctorsController.findOne`
  - `AvailabilityController.findByDoctor`
  - `AvailabilityController.getSlots`
  - `AppointmentsController.create`
- services/tables:
  - `DoctorsService` -> `doctors`, `users`
  - `AvailabilityService` -> `doctor_availability`, `doctor_availability_overrides`, `appointments`
  - `AppointmentsService` -> `appointments`

#### Doctor appointments list/detail
- `src/App.tsx` `/doctor/appointments`
- `src/pages/doctor/DoctorAppointments.tsx`
- `src/components/appointments/AppointmentDetailSheet.tsx`
- `src/services/api.ts`
  - `api.appointments.list`
  - `api.appointments.updateStatus`
  - `api.clinicalNotes.listByPatient`
  - `api.clinicalNotes.create`
- backend:
  - `AppointmentsController.findAll`
  - `AppointmentsController.updateStatus`
  - `PatientClinicalNotesController` for clinical note list/create
- services/tables:
  - `AppointmentsService` -> `appointments`, `patients`, `doctors`, `users`
  - `PatientClinicalNotesService` -> `patient_clinical_notes`

#### Staff pending-confirmation flow
- `src/App.tsx` `/staff/dashboard`
- `src/pages/staff/StaffDashboard.tsx`
- `src/services/api.ts`
  - `api.appointments.list({ status: "pending" })`
  - `api.appointments.updateStatus(..., "confirmed")`
  - `api.doctors.list()`
  - `api.availability.listByDoctor(...)`
- backend:
  - `AppointmentsController.findAll`
  - `AppointmentsController.updateStatus`
  - `DoctorsController.findAll`
  - `AvailabilityController.findByDoctor`
- services/tables:
  - `AppointmentsService` -> `appointments`
  - `DoctorsService` -> `doctors`, `users`
  - `AvailabilityService` -> `doctor_availability`

### What to open first
Recommended reading order for a fast onboarding pass:
1. `src/App.tsx`
2. `src/components/auth/RequireDoctorAccess.tsx`
3. `src/lib/auth-routing.ts`
4. `src/lib/doctor-access.ts`
5. `src/pages/doctor/DoctorSchedule.tsx`
6. `src/components/calendar/DoctorCalendar.tsx`
7. `src/types/calendar.ts`
8. `src/utils/calendarUtils.ts`
9. `src/services/api.ts`
10. `src/pages/DoctorProfile.tsx`
11. `src/pages/staff/StaffDashboard.tsx`
12. `src/pages/staff/StaffDoctors.tsx`
13. `src/pages/admin/ManageAppointments.tsx`
14. `backend/src/availability/availability.controller.ts`
15. `backend/src/availability/availability.service.ts`
16. `backend/src/availability-overrides/availability-overrides.controller.ts`
17. `backend/src/availability-overrides/availability-overrides.service.ts`
18. `backend/src/appointments/appointments.controller.ts`
19. `backend/src/appointments/appointments.service.ts`
20. `backend/src/database/schema/doctor-availability.schema.ts`
21. `backend/src/database/schema/doctor-availability-overrides.schema.ts`
22. `backend/src/database/schema/appointments.schema.ts`

### Change impact
- If editing appointment statuses:
  - also check `backend/src/appointments/dto/update-status.dto.ts`
  - `src/pages/doctor/DoctorAppointments.tsx`
  - `src/pages/admin/ManageAppointments.tsx`
  - `src/pages/staff/StaffDashboard.tsx`
  - `src/components/appointments/AppointmentDetailSheet.tsx`
- If editing availability slot logic:
  - also check `backend/src/availability/availability.service.ts`
  - `src/pages/DoctorProfile.tsx`
  - `src/components/calendar/DoctorCalendar.tsx`
  - `src/pages/staff/StaffDashboard.tsx`
  - `src/pages/staff/StaffDoctors.tsx`
- If editing override behavior:
  - also check `backend/src/availability-overrides/availability-overrides.service.ts`
  - `src/components/calendar/DoctorCalendar.tsx`
  - `src/components/calendar/OverrideModal.tsx`
  - runtime schema alignment for `doctor_availability_overrides`
- If editing doctor activation logic:
  - also check `backend/src/doctors/doctors.service.ts`
  - `src/components/auth/RequireDoctorAccess.tsx`
  - `src/lib/doctor-access.ts`
  - patient doctor discovery and booking eligibility
- If editing patient booking duration logic:
  - also check `src/pages/DoctorProfile.tsx`
  - `backend/src/availability/availability.service.ts`
  - `backend/src/appointments/appointments.service.ts`

## Inferred
- The repo already has enough pieces for an internal scheduler shell, but the source map shows why it is not yet a scheduling core:
  - read logic is assembled in the UI
  - mutation rules are incomplete across services
  - runtime schema truth is not trustworthy by metadata alone
- `DoctorCalendar` is currently the highest-leverage and highest-risk scheduling component because both doctor and staff workflows reuse it.
- The safest future refactor point is likely a stable schedule read model beneath the existing component tree, not a visual rewrite first.

## Unknown
- Whether future secretary workflow needs a separate schedule page instead of continuing to reuse `DoctorCalendar`.
- Whether appointment type-specific duration/buffer rules will require a different API shape.
- Whether any downstream analytics or reporting depend on the current status vocabulary quirks.
- Whether room/resource scheduling is expected to join this domain later.

## Concrete repo/runtime evidence
- Frontend code:
  - `src/App.tsx`
  - `src/pages/DoctorProfile.tsx`
  - `src/pages/MyAppointments.tsx`
  - `src/pages/doctor/DoctorSchedule.tsx`
  - `src/pages/doctor/DoctorAppointments.tsx`
  - `src/pages/staff/StaffDashboard.tsx`
  - `src/pages/staff/StaffDoctors.tsx`
  - `src/pages/admin/ManageAppointments.tsx`
  - `src/components/calendar/DoctorCalendar.tsx`
  - `src/components/appointments/AppointmentDetailSheet.tsx`
  - `src/services/api.ts`
  - `src/types/calendar.ts`
  - `src/utils/calendarUtils.ts`
- Backend code:
  - `backend/src/availability/availability.controller.ts`
  - `backend/src/availability/availability.service.ts`
  - `backend/src/availability-overrides/availability-overrides.controller.ts`
  - `backend/src/availability-overrides/availability-overrides.service.ts`
  - `backend/src/appointments/appointments.controller.ts`
  - `backend/src/appointments/appointments.service.ts`
  - `backend/src/doctors/doctors.service.ts`
  - `backend/src/app.module.ts`
- Runtime checks:
  - `docker logs clinic_api`
  - `docker exec clinic_db psql -U clinic_user -d clinic_db ...`

## Implication for next phase
Use this file as the primary orientation map before touching scheduling code. If a change does not clearly fit somewhere in this source map, it is probably drifting outside the safe scheduling scope or hiding a coupling that should be surfaced before implementation.
