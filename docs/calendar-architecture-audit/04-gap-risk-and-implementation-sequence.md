# Calendar Architecture Audit: Gap, Risk, and Implementation Sequence

## Scope
This document compares the current scheduling architecture to the target clinic scheduling core, identifies the main implementation risks, and proposes the minimum-change execution order that protects existing flows while enabling a Google-Calendar-style internal scheduler later.

## Proven
### Current vs target gap map
| Area | Current state | Target need | Proven gap |
| --- | --- | --- | --- |
| Runtime schema | Live DB is missing `doctor_availability_overrides` and `patient_clinical_notes` | Runtime DB must match repo scheduling schema | Current runtime cannot support the existing schedule path reliably |
| Scheduling core | Availability, overrides, and appointments are separate services | One authoritative scheduling core or invariant layer | No central enforcement of booking truth |
| Appointment creation | `AppointmentsService.create(...)` inserts directly | Create must validate availability, overlap, doctor activity, and lifecycle | Appointment creation currently bypasses scheduling-core validation |
| Status vocabulary | Backend accepts `pending`, `scheduled`, `confirmed`, `completed`, `cancelled`, `no_show` | One clear lifecycle used consistently across UI and backend | UI and DTO vocabulary are inconsistent |
| Doctor activation | Discovery filters active doctors; some other flows do not hard-block inactive doctors | Inactive doctors must never be bookable | Current safety is incomplete |
| Time handling | Date/day logic mixes local `Date`, `parseISO`, and string times | Shared clinic-local normalization | Current logic is timezone-naive |
| Staff workflow | Staff has dashboard + doctor list, not a dedicated scheduling core | Secretary/staff workflow should operate on the same scheduling truth as doctor calendar | Current staff flow is partial and operational, not full scheduling-core driven |
| Dense interaction | Calendar renders and edits some entities | Drag/select/move/resize need safe server validation | Current backend is not ready for advanced interactions |

### Technology conflict analysis
- Existing tech is sufficient for a v1 internal scheduler shell:
  - `react-big-calendar`
  - `react-day-picker`
  - `date-fns`
  - TanStack Query
- A new calendar library is not justified before backend truth is fixed.
- Replacing the library now would increase moving parts without addressing:
  - runtime schema drift
  - overlap enforcement
  - inactive-doctor blocking
  - lifecycle consistency
- Forcing drag/drop too early would create rollback and conflict-resolution pain because the backend does not yet authoritatively decide whether a moved event is legal.

## Inferred
### Main risks before implementation
#### Schema and migration risks
- Migration history in `backend/drizzle/meta` cannot be treated as sufficient proof that runtime schema is correct.
- Naive implementation could add new scheduling features on top of a live database that is already missing required tables.

#### DTO and API contract risks
- `UpdateStatusDto` allows statuses that doctor/admin UIs do not fully represent.
- `DoctorProfile.tsx` hard-codes 30-minute appointment length instead of reading slot duration or a server-derived slot model.
- `AppointmentsController.findAll(...)` normalizes both `doctorId` and `doctor_id` style filters, which means frontend/API contract drift is already being tolerated in the controller layer.

#### Auth and guard risks
- `RequireDoctorAccess` allows literal `doctor` role through even if doctor profile state is not revalidated on the frontend.
- `DoctorSchedule.tsx` resolves the doctor record by `api.doctors.list()` and local matching, which couples doctor access to list shape and returned membership.
- Staff shares doctor calendar infrastructure before role-specific edit boundaries are formalized.

#### Timezone and date-normalization risks
- `AvailabilityService.getBookableSlots(...)` derives day-of-week from `new Date(\`${date}T00:00:00\`)`.
- `DoctorCalendar` uses `date.toISOString().split("T")[0]` in slot logic.
- Event conversion uses `parseISO(...)` and local `Date` math.
- These mixed approaches can diverge around clinic-local day boundaries.

#### Overlap and conflict risks
- Availability overlap is checked inside `AvailabilityService.create/update(...)`.
- Appointment overlap is not enforced in `AppointmentsService.create(...)`.
- Override changes are not modeled as conflict-aware operations against existing appointments.

#### Hidden coupling risks
- `DoctorCalendar` is reused by both doctor and staff surfaces.
- Editing availability slot logic affects:
  - doctor schedule
  - staff doctor calendar
  - patient public slot generation
  - staff dashboard availability summary
- Editing appointment statuses affects:
  - patient appointment views
  - doctor appointment tabs
  - admin appointment management
  - staff pending confirmation flow

### Must decide before implementation
- Final lifecycle vocabulary:
  - whether `scheduled` should exist at all
  - whether `pending -> confirmed` is the secretary-reviewed path
- Role naming and permissions:
  - keep `staff` as secretary-equivalent or introduce separate secretary semantics later
- Clinic-local timezone policy:
  - how date-only values map to slot generation and calendar rendering
- Notes visibility:
  - what stays patient-visible
  - what is internal-only for doctor/staff/admin

### Can stay flexible for later
- Exact mini-calendar styling and sidebar composition
- Dense-grid motion polish
- Drag/resize affordances
- Recurrence depth beyond weekly availability
- Future multi-owner filter sophistication

## Unknown
- Whether the live database drift is environment-specific or systemic.
- Whether any external scheduling/reporting systems consume current appointment status values.
- Whether future clinic operations need room/resource conflict logic in addition to doctor conflict logic.
- Whether appointment duration should stay derived from availability slot duration or evolve into a per-appointment rule.

## Concrete repo/runtime evidence
- Runtime schema mismatch:
  - `backend/drizzle/0007_hesitant_vargas.sql`
  - `backend/drizzle/0008_bent_wrecking_crew.sql`
  - `backend/drizzle/baseline_existing_db.sql`
  - `backend/drizzle/meta/_journal.json`
  - runtime checks against `clinic_db`
- Booking logic without scheduling-core enforcement:
  - `backend/src/appointments/appointments.service.ts`
  - `backend/src/appointments/dto/create-appointment.dto.ts`
- Status vocabulary mismatch:
  - `backend/src/appointments/dto/update-status.dto.ts`
  - `src/pages/doctor/DoctorAppointments.tsx`
  - `src/pages/admin/ManageAppointments.tsx`
  - `src/components/appointments/AppointmentDetailSheet.tsx`
- Time handling split:
  - `backend/src/availability/availability.service.ts`
  - `src/pages/DoctorProfile.tsx`
  - `src/components/calendar/DoctorCalendar.tsx`
  - `src/utils/calendarUtils.ts`
- Doctor activation and doctor-access shape:
  - `backend/src/doctors/doctors.service.ts`
  - `src/components/auth/RequireDoctorAccess.tsx`
  - `src/lib/doctor-access.ts`

## Implication for next phase
### Do First
1. Restore runtime schema truth for scheduling-adjacent tables.
2. Stabilize scheduling-core invariants:
   - overlap checks
   - inactive-doctor exclusion
   - slot validity
   - clear status transitions
3. Stabilize permissions and read models across doctor, staff, admin, and patient.

### Do Later
4. Build the calendar shell around the existing stack.
5. Render availability, overrides, and appointments from stable read models.
6. Add create/edit flows for appointment and schedule operations.
7. Add drag-select, drag-move, and resize only after server validation is trusted.

### Do Not Touch Yet
- Homepage, landing, and brochure surfaces
- Calendar library replacement
- Broad UI refactors unrelated to scheduling truth
- Rich recurrence models not demanded by current workflow evidence

This sequence is the lowest-risk path because it starts with truth, then permissions, then read-model stability, and only then adds richer interaction.
