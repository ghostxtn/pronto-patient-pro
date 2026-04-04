# Calendar Architecture Audit: Current State

## Scope
This document maps how scheduling works today across frontend routes, components, API clients, backend entrypoints, and schema. It only covers files that materially affect calendar behavior, appointment lifecycle, availability, overrides, scheduling auth, or reusable scheduling UI.

## Proven
### Frontend routes and entrypoints
- `src/App.tsx` exposes four scheduling-relevant route groups:
  - patient booking: `/patient/doctors/:id`, `/patient/appointments`
  - doctor scheduling: `/doctor/schedule`, `/doctor/appointments`, `/doctor/patients/:id`
  - staff operations: `/staff/dashboard`, `/staff/doctors`
  - admin operations: `/admin/appointments`
- Doctor scheduling routes are guarded by `RequireDoctorAccess` in `src/components/auth/RequireDoctorAccess.tsx`.
- `RequireDoctorAccess` allows access if either:
  - `user.role === "doctor"`
  - or `api.doctors.me()` returns an active doctor profile according to `hasActiveDoctorProfile(...)` in `src/lib/doctor-access.ts`
- The repo does not contain a `hasDoctorAccess` symbol. The actual helper is `hasActiveDoctorProfile(...)`.
- The repo does not contain `getDefaultRouteForRole`. The actual symbol is `getDefaultRouteByRole(...)` in `src/lib/auth-routing.ts`.

### Doctor-facing current state
- `src/pages/doctor/DoctorSchedule.tsx` does not call `api.doctors.me()`. It loads all doctors via `api.doctors.list()` and finds the row whose `user_id` matches the logged-in user.
- Once that doctor row is found, `DoctorSchedule` renders `DoctorCalendar`.
- `src/components/calendar/DoctorCalendar.tsx` is the current internal calendar surface. It:
  - loads weekly availability with `api.availability.listByDoctor(doctorId)`
  - loads date-range overrides with `api.availabilityOverrides.listByDoctor(doctorId, date_from, date_to)`
  - loads appointments with `api.appointments.list({ doctor_id, date_from, date_to })`
  - renders them in `react-big-calendar`
  - opens `AvailabilityModal` to create/edit recurring availability
  - opens `OverrideModal` to create/edit blackout or custom-hours overrides
  - opens `AppointmentDetailSheet` for appointment detail and clinical note access
- `src/pages/doctor/DoctorAppointments.tsx` is a separate doctor workflow. It independently calls `api.appointments.list({ doctor_id })` and updates confirmed appointments to completed.
- `src/components/appointments/AppointmentDetailSheet.tsx` lets non-staff users view historical clinical notes and create a new clinical note for the patient attached to an appointment.

### Patient-facing current state
- `src/pages/DoctorProfile.tsx` is the patient booking surface.
- It loads:
  - doctor profile with `api.doctors.get(id)`
  - recurring availability with `api.availability.listByDoctor(id)`
  - bookable slots with `api.availability.getDoctorSlots(id, yyyy-MM-dd)`
- Booking is created directly by `api.appointments.create(...)`.
- The patient flow calculates `endTime` by adding 30 minutes to the selected slot in the frontend, even though `doctor_availability` rows contain `slot_duration`.

### Staff/secretary current state
- There is no dedicated secretary calendar workspace yet. The current role in code is `staff`.
- `src/pages/staff/StaffDashboard.tsx` is an operational dashboard, not a scheduler. It:
  - lists pending appointments with `api.appointments.list({ status: "pending" })`
  - lists today's appointments with `api.appointments.list({ date_from, date_to })`
  - loads all doctors with `api.doctors.list()`
  - then loads each doctor's recurring availability with `api.availability.listByDoctor(doctor.id)` to compute same-day availability summaries
  - confirms appointments by calling `api.appointments.updateStatus(id, "confirmed")`
- `src/pages/staff/StaffDoctors.tsx` reuses the same `DoctorCalendar` component used by doctors. The current schedule failure therefore affects both doctor and staff calendar viewing.

### Admin current state
- `src/pages/admin/ManageAppointments.tsx` is the main admin operational appointment management view.
- It loads all appointments through `api.appointments.list()`, filters client-side, and updates statuses via `api.appointments.updateStatus`.
- Admin appointment management does not use the internal calendar component. It is table/filter/dialog based.

### API client surface
- `src/services/api.ts` exposes the scheduling-related frontend surface:
  - `api.availability.listByDoctor(doctorId)` -> `GET /availability/:doctorId`
  - `api.availability.getDoctorSlots(doctorId, date)` -> `GET /availability/slots?doctor_id=...&date=...`
  - `api.availability.create/update/remove`
  - `api.availabilityOverrides.listByDoctor(doctorId, dateFrom, dateTo)` -> `GET /availability-overrides?...`
  - `api.availabilityOverrides.create/update/remove`
  - `api.appointments.list/get/create/update/updateStatus/delete`
  - `api.clinicalNotes.listByPatient/create`

### Backend current state
- Scheduling is handled by three separate backend modules:
  - `backend/src/availability`
  - `backend/src/availability-overrides`
  - `backend/src/appointments`
- Global guards are registered in `backend/src/app.module.ts`:
  - `JwtAuthGuard`
  - `RolesGuard`
  - `TenantGuard`
- `AvailabilityController` exposes:
  - public slot lookup: `GET /availability/slots`
  - recurring availability CRUD for roles `owner`, `admin`, `doctor`, `staff`
- `AvailabilityOverridesController` exposes date exception CRUD for roles `owner`, `admin`, `doctor`, `staff`
- `AppointmentsController` exposes:
  - create for roles `owner`, `admin`, `doctor`, `staff`, `patient`
  - list for current clinic and current user context
  - update and status update for `owner`, `admin`, `doctor`, `staff`
  - appointment notes for doctors

### Database truth
- Scheduling-related schema lives in:
  - `backend/src/database/schema/doctor-availability.schema.ts`
  - `backend/src/database/schema/doctor-availability-overrides.schema.ts`
  - `backend/src/database/schema/appointments.schema.ts`
  - adjacent role/identity tables in `doctors.schema.ts`, `patients.schema.ts`, `users.schema.ts`
- Current table responsibilities:
  - `doctor_availability`: recurring weekly working periods with `day_of_week`, `start_time`, `end_time`, `slot_duration`, `is_active`
  - `doctor_availability_overrides`: per-date `blackout` or `custom_hours` exceptions
  - `appointments`: booking rows with doctor/patient/date/time/status/type/notes
  - `doctors`: doctor profile ownership, activation, specialization, clinic scoping
  - `patients` and `users`: patient/user identity linkage

### Current behavior by role
- Patient:
  - can browse active doctors through patient routes
  - can view weekly availability and public bookable slots
  - can create an appointment request directly
  - can cancel via `MyAppointments`
- Doctor:
  - can access internal schedule and appointment list
  - can manage recurring availability and per-date overrides
  - can view appointment details and clinical notes
  - can complete confirmed appointments
- Staff:
  - can view pending appointments and confirm them
  - can open doctor calendars through `StaffDoctors`
  - can manage availability and overrides through the reused `DoctorCalendar`
- Admin:
  - can manage appointments operationally
  - can manage doctors/staff and influence doctor activation status indirectly

## Inferred
- The product direction already points toward a single scheduling source of truth, but the code does not yet implement one.
- Current frontend screens compose multiple partial models rather than consuming an authoritative schedule aggregate.
- `DoctorCalendar` is the closest thing to an internal scheduler today, but it is still a UI composition over fragmented backend truth.
- Reusing `DoctorCalendar` in `StaffDoctors` means doctor and staff scheduling behavior are tightly coupled at the component level before role-specific scheduling needs have been formally modeled.
- The patient booking flow assumes more backend enforcement than actually exists. It can request slots from `AvailabilityService`, but appointment creation itself is not forced back through the same scheduling invariants.

## Unknown
- Whether product wants doctor and staff to continue sharing one internal calendar component long-term.
- Whether `staff` is intended to remain the secretary-equivalent role or only a temporary operational role name.
- Whether there are hidden runtime policies outside the repo that compensate for missing overlap and activation enforcement.
- Whether future appointment types need different durations or buffers beyond the current slot model.

## Concrete repo/runtime evidence
- Routes and guards:
  - `src/App.tsx`
  - `src/components/auth/RequireDoctorAccess.tsx`
  - `src/lib/auth-routing.ts`
  - `src/lib/doctor-access.ts`
- Doctor scheduling UI:
  - `src/pages/doctor/DoctorSchedule.tsx`
  - `src/components/calendar/DoctorCalendar.tsx`
  - `src/components/calendar/AvailabilityModal.tsx`
  - `src/components/calendar/OverrideModal.tsx`
  - `src/components/appointments/AppointmentDetailSheet.tsx`
- Patient booking:
  - `src/pages/DoctorProfile.tsx`
  - `src/pages/MyAppointments.tsx`
- Staff/admin operations:
  - `src/pages/staff/StaffDashboard.tsx`
  - `src/pages/staff/StaffDoctors.tsx`
  - `src/pages/admin/ManageAppointments.tsx`
- Frontend API:
  - `src/services/api.ts`
- Backend:
  - `backend/src/availability/availability.controller.ts`
  - `backend/src/availability/availability.service.ts`
  - `backend/src/availability-overrides/availability-overrides.controller.ts`
  - `backend/src/availability-overrides/availability-overrides.service.ts`
  - `backend/src/appointments/appointments.controller.ts`
  - `backend/src/appointments/appointments.service.ts`
  - `backend/src/doctors/doctors.service.ts`
  - `backend/src/app.module.ts`
- Schema:
  - `backend/src/database/schema/doctor-availability.schema.ts`
  - `backend/src/database/schema/doctor-availability-overrides.schema.ts`
  - `backend/src/database/schema/appointments.schema.ts`
  - `backend/src/database/schema/doctors.schema.ts`
  - `backend/src/database/schema/patients.schema.ts`
  - `backend/src/database/schema/users.schema.ts`

## Implication for next phase
The next implementation phase should not treat the existing schedule as a stable core. It should treat it as:
- a useful starting UI shell
- a fragmented backend truth model
- a role model with real operational intent but incomplete enforcement

Any future calendar work should stabilize backend truth before layering richer interaction behavior on top.
