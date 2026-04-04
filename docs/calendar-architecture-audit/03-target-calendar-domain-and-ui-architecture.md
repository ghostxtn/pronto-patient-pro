# Calendar Architecture Audit: Target Domain and UI Architecture

## Scope
This document defines the minimum honest target architecture for a clinic-grade internal scheduling system inspired by Google Calendar interaction quality, while staying grounded in the repo’s current product direction, existing stack, and proven constraints.

## Proven
### Existing domain concepts worth preserving
- The repo already distinguishes recurring working availability from date-specific exceptions:
  - recurring working hours: `doctor_availability`
  - date overrides: `doctor_availability_overrides`
- The repo already has an appointment lifecycle field in `appointments.status`.
- The repo already supports clinic-scoped roles with scheduling relevance:
  - `patient`
  - `doctor`
  - `staff`
  - `admin`
  - `owner`
- The internal calendar shell already exists and is viable as a foundation:
  - `DoctorCalendar` uses `react-big-calendar`
  - `AvailabilityModal` and `OverrideModal` already model recurring and per-date edits
  - `AppointmentDetailSheet` already acts like an event detail panel
- Product language and UI copy in scheduling surfaces are Turkish-first.

### Target domain model that fits this repo
The minimum scheduling core for this codebase should distinguish these concepts explicitly:
- Working availability
  - existing fit: `doctor_availability`
  - meaning: recurring weekly periods a doctor can generally work
- Per-date override
  - existing fit: `doctor_availability_overrides`
  - meaning: a specific date is either closed (`blackout`) or uses custom hours (`custom_hours`)
- Appointment request
  - existing natural fit: `appointments.status = pending`
  - meaning: patient requested or staff entered but not yet approved/finalized
- Approved/confirmed appointment
  - existing natural fit: `appointments.status = confirmed`
- Completed / cancelled / no-show
  - existing fit already present in backend DTO vocabulary
- Manual secretary/staff booking
  - best fit for now: a booking workflow over `appointments`, not a separate table by default
- Internal notes vs patient-visible notes
  - patient request text can stay on `appointments.notes` only if treated as patient-visible/request-context
  - doctor/staff internal notes should remain separate from patient-visible text
- Inactive-doctor exclusion
  - must be a hard server-side invariant, not only a discovery/UI preference
- Clinic-local timezone normalization
  - appointment day and slot lookup must share one clinic-local date policy

### UI architecture target
- Safest frontend direction is to evolve the existing internal calendar stack rather than replacing it now.
- The internal scheduler should be a dedicated shell around current pieces:
  - top toolbar with next/prev/today/view controls
  - left mini-calendar/date picker
  - left filters/legend for schedule layers
  - main week/day grid
  - event detail sheet or composer side panel
  - contextual create/edit flows for availability, overrides, and appointments
- Role-specific surfaces should share the shell but not necessarily identical controls:
  - doctor: own schedule and appointment workflow
  - staff/secretary: multi-doctor operations and review flow
  - admin: oversight, exceptions, audit, and support tools
  - patient: separate booking surface, not the dense internal scheduler

## Inferred
### Recommended scheduling-core boundaries
- Server truth should own:
  - doctor activation eligibility
  - recurring availability
  - per-date overrides
  - appointment lifecycle
  - overlap/conflict decisions
  - allowed status transitions
  - persisted time ranges and normalized appointment dates
  - role-based permission decisions
- Local UI state should own:
  - current visible date
  - current view mode (`day`, `week`, eventually `agenda`)
  - selected event
  - open/closed sheet or popover state
  - draft form values before save
  - visual filters and legend toggles
  - temporary selection rectangles or drag state later

### What the domain should include now
- Recurring weekly availability
- Per-date blocked time and custom-hour override
- Appointment request and approval lifecycle
- Manual staff booking flow over the same appointment entity
- Separate internal note handling
- Clear ownership:
  - doctor-owned availability
  - clinic/staff/admin scheduling operations under role checks
  - patient-facing booking as a separate surface backed by the same scheduling truth

### What should stay flexible for later
- Recurrence sophistication beyond weekly availability plus per-date override
- Google-like multi-calendar richness such as arbitrary calendar ownership groups
- drag-resize and drag-move persistence
- advanced density polish and keyboard interaction breadth

### Optimistic UI guidance
- Safe candidates for optimistic UI later:
  - date navigation
  - panel open/close
  - local filtering
  - possibly status badge updates with rollback if transition rules are stable
- Unsafe candidates until scheduling-core invariants are enforced:
  - appointment create
  - appointment move/resize
  - availability edits that can overlap
  - override edits that can invalidate existing bookings

### Role-specific target variants
- Doctor
  - own calendar only
  - availability and override management
  - appointment detail and internal note context
- Staff/secretary
  - multi-doctor schedule operations
  - pending request review
  - manual booking and reschedule tools
  - internal-only operational notes
- Admin
  - audit/oversight and status correction
  - activation/deactivation and exception management
  - not the primary dense day-to-day scheduler
- Patient
  - date picker + available-slot booking
  - no implication of internal calendar richness

## Unknown
- Whether the final secretary-reviewed flow requires a dedicated explicit “approved by secretary” audit trail or can stay within `pending -> confirmed`.
- Whether appointment buffers, room/resource conflicts, or multi-provider events are in future scope.
- Whether notes visibility should be split into separate tables or can be handled with carefully separated existing note models.
- Whether future recurrence requirements justify a distinct recurrence model instead of continuing with weekly availability plus date overrides.

## Concrete repo/runtime evidence
- Existing internal calendar shell:
  - `src/components/calendar/DoctorCalendar.tsx`
  - `src/components/calendar/AvailabilityModal.tsx`
  - `src/components/calendar/OverrideModal.tsx`
  - `src/components/appointments/AppointmentDetailSheet.tsx`
- Existing types and event conversion:
  - `src/types/calendar.ts`
  - `src/utils/calendarUtils.ts`
- Existing API surface:
  - `src/services/api.ts`
- Existing domain persistence:
  - `backend/src/database/schema/doctor-availability.schema.ts`
  - `backend/src/database/schema/doctor-availability-overrides.schema.ts`
  - `backend/src/database/schema/appointments.schema.ts`
  - `backend/src/database/schema/doctors.schema.ts`
- Existing role-sensitive service behavior:
  - `backend/src/appointments/appointments.service.ts`
  - `backend/src/doctors/doctors.service.ts`
  - `backend/src/availability/availability.service.ts`

## Implication for next phase
The safest target is not “build a brand new calendar.” It is:
- keep the existing calendar stack
- centralize server scheduling truth first
- then reshape doctor and staff scheduling UIs around one authoritative domain model

That preserves momentum, avoids fake richness, and keeps the internal scheduler aligned with the actual clinic workflow instead of a generic calendar demo.
