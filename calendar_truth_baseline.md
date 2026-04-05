# Calendar Truth Baseline

## 1. Scope
**What was audited:**
A strict review of the files governing the calendar and appointment booking system, focusing on:
- The React frontend staff calendar and related modals (`DoctorCalendar.tsx`, `AvailabilityModal.tsx`, `OverrideModal.tsx`).
- The patient-facing booking flow (`DoctorProfile.tsx`).
- Frontend utility and API configuration (`api.ts`, `calendarUtils.ts`, `index.css`).
- Backend core services for appointments, availability, and overrides (`appointments.service.ts`, `availability.service.ts`, `availability-overrides.service.ts`).

**What was intentionally excluded:**
- Homepage and marketing pages.
- General design system and global UI components not specific to the calendar.
- Authentication flows, billing, reporting, and other unrelated repository areas.

## 2. High-level system behavior
- **Staff Calendar:** The core visual surface uses `react-big-calendar`. It defaults to a weekly view but supports month, day, and agenda views. It aggregates three types of data client-side: standard weekly availability slots, daily overrides (exceptions), and booked appointments.
- **Managed Availability:** Availability is managed on a weekly repeating basis (e.g., every Monday from 09:00 to 17:00). Each slot has an associated duration (15, 20, 30, 45, or 60 minutes) and an active/inactive toggle.
- **Overrides / Exceptions / Blocks:** Overrides apply to specific dates and trump general availability. There are two types:
  - **Blackout:** Closes the entire day.
  - **Custom Hours:** Subtracts a specific time interval from the day's availability (acting as a break or blocked interval), despite being labeled as "Özel saat belirle" (Set custom hours) in the UI.
- **Patient Booking:** Patients view a doctor's profile and use a calendar (`react-day-picker`) to select a date. The system disables past dates and days of the week lacking recurring availability. Upon selecting a valid date, the frontend fetches exactly computed available slots from the backend. The patient selects a time slot, adds notes, and confirms the booking.
- **Appointments:** Appointments tie a patient to a doctor at a specific clinic, date, and time. Patient personal data and clinical notes are encrypted at the database level.
- **Staff vs. Patient Truth Divergence:** The staff calendar visually constructs availability purely client-side by overlaying recurring availability, overrides, and appointments on the calendar grid. In contrast, patient booking relies entirely on the backend `getBookableSlots` to compute an exact array of available start times.

## 3. Frontend behavior by surface

### Staff calendar (`DoctorCalendar.tsx`)
- Rendered using `react-big-calendar` heavily customized with local styling.
- Features a custom toolbar with navigation and a prominent "Musaitligi Yonet" (Manage Availability) button that opens a side sheet.
- **Interactions:**
  - Clicking on a calendar header (the date) opens a context menu to add an override ("Bu günü kapat" or "Özel saat belirle").
  - Clicking on an empty time grid area opens the `AvailabilityModal` to create a new weekly repeating availability block. It pre-fills the clicked day and time.
  - Clicking on an existing availability block (rendered in green via `slotPropGetter`) opens the modal to edit that weekly rule.
  - Clicking on an appointment shows its details via `AppointmentDetailSheet`.
  - Managing active slots and overrides occurs in a side-sheet listing view, decoupled from direct calendar-grid manipulation.

### Availability modal (`AvailabilityModal.tsx`)
- Handles creation and editing of weekly availability rules.
- Fields: Day of the week (dropdown), Start Time, End Time, Slot Duration (dropdown).
- Client-side validation ensures the end time is strictly after the start time.
- Provides a delete option when editing an existing slot.
- Handles `409 Conflict` errors gracefully, informing the user if the new slot overlaps with an existing active slot (enforced via backend overlap validation).

### Override / exception flow (`OverrideModal.tsx`)
- Handles creation and editing of daily exceptions.
- Fields: Date, Type (Radio: "Blackout" or "Custom hours").
- If "Custom hours" is selected, exposes Start Time and End Time fields.
- Reason field is optional but useful for context (e.g., "Holiday", "Meeting").
- Overrides are listed in the Availability Management side sheet, sorted by date, where they can be edited or deleted.

### Patient booking page (`DoctorProfile.tsx`)
- Displays doctor details, specialization, and weekly schedule summary.
- The booking section uses a `Calendar` component. Past dates and days of the week without any general availability rules are disabled client-side.
- **Weak Override Awareness:** The patient date picker client-side validation *ignores* overrides. It only checks `availableDays` (recurring weekly rules). If a date is blacked out via an override, the date picker still allows selecting it, resulting in an empty slot list returned from the backend.
- When a valid date is clicked, it fetches the available time slots via the `/availability/slots` endpoint.
- Displays slots as a grid of buttons. 
- Submitting the form calls the appointment creation endpoint, passing the date, start time, and a computed end time (hardcoded on the frontend to `start_time + 30 mins` in this baseline).

### Slot rendering / states
- **Background (`slotPropGetter`):** Standard weekly availability slots are colored light green (`#dcfce7`) to indicate working hours.
- **Appointments:** Rendered as blue events over the grid.
- **Blackouts:** Rendered as red, all-day events.
- **Custom Hours:** Rendered as yellow events.

## 4. Backend behavior by service

### availability.service.ts
- **`getBookableSlots`:** The core engine for calculating what a patient can book.
  - It fetches standard active availability blocks for the given day of the week.
  - It checks for overrides on the specific date.
  - If a "blackout" override exists, it immediately returns no slots.
  - If a "custom_hours" override exists, it generates slots *outside* the override's time bounds (effectively treating the "custom hours" as a break or blocked time).
  - It generates slots based on the `slot_duration`.
  - Finally, it fetches existing non-cancelled appointments for that date and removes any generated slots whose start time exactly matches an appointment's start time.
- **Validation:** Overlap detection prevents creating or updating standard availability blocks that intersect with existing ones (`hasOverlap` check).

### availability-overrides.service.ts
- Manages the CRUD for daily exceptions.
- **Validation:** 
  - Prevents "blackout" types from having start/end times.
  - Ensures "custom_hours" have valid, chronological start/end times.
  - Ensures no duplicate override exists for the same doctor, date, and type combination.

### appointments.service.ts
- **Creation:** Enforces that a user with the `patient` role is strictly booking for their own `patient.id`.
- **Missing Guardrails:** The `create` method directly inserts the appointment without validating if the requested time slot is actually available, doesn't overlap with another appointment, or respects blackouts/overrides. It blindly trusts the frontend payload.
- **Encryption:** Hooks into `EncryptionService` to encrypt sensitive patient data (`firstName`, `lastName`, `email`) and clinical notes (`diagnosis`, `treatment`, `prescription`, `notes`).
- Provides filtering across clinics, doctors, dates, and statuses.

### relevant schema / dto truth
- The system heavily relies on `clinic_id` multi-tenancy constraints.
- Availability blocks (`doctorAvailability`) define `slot_duration`, defaulting to 30 minutes as a fallback.
- Overrides (`doctorAvailabilityOverrides`) have a unique composite key logic indirectly enforced by the service to prevent multiple overrides of the *same type* on the same date.

## 5. Stable truths in the old project
These behaviors were robust and should be treated as safe baseline truth:
- **Clean Separation of Concerns:** Standard recurring availability is distinctly separate from daily overrides in the database and service layers.
- **Multi-tenant Security:** All significant queries correctly scope to `clinic_id`.
- **Exact Match Slot Filtering:** The method of filtering available slots by exactly matching the `start_time` of existing appointments is deterministic for patient booking.
- **Encryption Architecture:** Transparent encryption of sensitive patient data and notes at the service layer before reaching the DB schema.
- **Hard-reject Weekly Overlaps:** The backend correctly blocks creating overlapping recurring availability blocks via a strict `409 Conflict` check.

## 6. Known limitations in the old project
- **Staff-vs-Patient Truth Divergence:** The staff calendar computes visual availability purely client-side based on raw fetched rules, while patients rely on a server-side computed array of exact slots. This creates a risk where the visual staff calendar might show a slot as "available" while the backend slot generator would exclude it due to edge-case overlaps.
- **Backend Booking Lacks Validation:** `appointments.service.ts` lacks validation during appointment creation. It does not check for double-booking, overrides, or active availability. It blindly writes the appointment, creating a severe TOCTOU (Time-of-Check to Time-of-Use) / stale booking risk where two users could book the exact same slot concurrently.
- **`custom_hours` Semantic Ambiguity:** The backend logic for `custom_hours` generates slots *outside* the specified override times (before the override start and after the override end). This means the backend treats "custom hours" as a **break or blocked interval**, whereas the frontend UI labels it as "Özel saat belirle" (Set custom working hours) and renders it yellow. This mismatch is a critical logic bug.
- **Weak Override Awareness in Patient Booking:** The patient date picker client-side logic only checks for recurring weekly availability. It ignores blackouts. A patient can click a blacked-out day, only to be shown an empty list of time slots.
- **Patient Booking Slot Duration Hardcoding:** In `DoctorProfile.tsx`, the end time of an appointment is hardcoded to `start_time + 30 mins`, completely ignoring the `slot_duration` defined by the doctor's actual availability block.
- **Staff Appointment Creation is Missing:** Staff cannot create appointments directly from the calendar grid. Clicking empty slots opens the availability manager rather than an appointment booking flow.
- **Same-day Multi-block Complexity:** While the DB supports multiple availability blocks on the same day (e.g., 09:00-12:00 and 13:00-17:00), the UI interactions and override computations become brittle when trying to apply a single daily override across multiple complex blocks. The override schema lacks support for multiple distinct breaks per day.
- **Override Collision Constraints:** The backend prevents creating multiple overrides of the *same type* on the same day, but does not explicitly prevent having both a "blackout" and a "custom_hours" override on the same date.

## 7. Preserved gains that the final stabilized project should try to keep
Based on the evolution of the project, the final stabilized version should ensure these newer operational improvements are preserved, overriding the old limitations:
- **Direct staff appointment creation from calendar:** Staff should click an empty grid space to create an appointment, not just manage availability.
- **Registered patient selection:** Staff should be able to search and select existing patients when booking via the calendar.
- **Temporary patient/manual booking flow:** Staff should be able to create quick appointments with just a name and phone number without requiring a full patient account.
- **Direct calendar interaction for block placement:** Staff should be able to easily drag or click to place ad-hoc blocks/breaks directly on the calendar interface, replacing the clunky side-sheet "custom_hours" approach.
- **Improved staff calendar surface:** Maintaining a clean, interactive, and highly responsive calendar view.

## 8. File-by-file truth notes

- **`src/components/calendar/DoctorCalendar.tsx`**
  - *Role:* Main staff interface for scheduling.
  - *Truth:* Correctly aggregates 3 data sources (appointments, blocks, overrides) visually client-side. Utilizes `react-big-calendar` effectively with custom `slotPropGetter` for green backgrounds.
  - *Limitation:* Interactions are overly tied to managing recurring availability. Clicking an empty slot attempts to create a weekly rule rather than an appointment.

- **`src/pages/DoctorProfile.tsx`**
  - *Role:* Patient-facing booking portal.
  - *Truth:* Securely fetches exact computed slots from the backend to present to the user.
  - *Limitation:* Date picker has weak override awareness (allows clicking blacked-out days). Hardcodes 30-minute durations on checkout regardless of doctor settings.

- **`src/components/calendar/AvailabilityModal.tsx`**
  - *Role:* UI for creating/editing weekly recurring availability.
  - *Truth:* Correctly maps payload and handles `409` conflict responses from the backend to alert users of overlapping slots.

- **`src/components/calendar/OverrideModal.tsx`**
  - *Role:* UI for creating/editing daily exceptions.
  - *Truth:* Enforces client-side validation that "custom_hours" requires chronologically valid start/end times.
  - *Limitation:* The UI labels "custom_hours" as if it sets working hours, but the backend subtracts these hours as a break.

- **`src/services/api.ts`**
  - *Role:* Frontend API client and definition.
  - *Truth:* Defines `getDoctorSlots` as an unauthenticated (`omitAuth: true`) endpoint for the patient booking flow.
  - *Limitation:* Returns raw errors directly; relies on components to parse and handle 409s manually.

- **`src/utils/calendarUtils.ts`**
  - *Role:* Translates backend payloads to `react-big-calendar` event formats.
  - *Truth:* Converts override dates into all-day (for blackouts) or timed (for custom_hours) `CalendarEvent` objects. Uses `date-fns` for robust parsing.

- **`src/index.css`**
  - *Role:* Global styling and `react-big-calendar` overrides.
  - *Truth:* Contains critical styles to make the calendar interactive (`cursor: pointer !important` on `.rbc-time-slot`).
  - *Limitation:* Heavy use of `!important` tags for basic interactions indicates fighting with the default library styles.

- **`backend/src/availability/availability.service.ts`**
  - *Role:* Core slot computation engine.
  - *Truth:* Overlap prevention logic is solid during creation of recurring slots. Slot computation (`getBookableSlots`) correctly strips booked appointments.
  - *Limitation:* The semantic execution of `custom_hours` overrides behaves like a break/pause rather than a reassignment of working hours.

- **`backend/src/appointments/appointments.service.ts`**
  - *Role:* Booking and data lifecycle management.
  - *Truth:* Excellent security model with patient-role overrides and data encryption.
  - *Limitation:* Absolutely zero availability/overlap validation at creation time. Blindly accepts and inserts appointments, exposing the system to double-booking and TOCTOU bugs.

- **`backend/src/availability-overrides/availability-overrides.service.ts`**
  - *Role:* Exception management logic.
  - *Truth:* Validates chronological bounds of custom_hours. Prevents identical duplicates.
  - *Limitation:* Fails to prevent overlapping or conflicting overrides on the same day (e.g. blackout + custom_hours).

## 9. Final baseline verdict
**What should be preserved from the old system:**
- The robust backend separation between recurring availability (`doctorAvailability`) and daily exceptions (`doctorAvailabilityOverrides`).
- The multi-tenant security scoping (`clinic_id`) and encryption patterns.
- The base UI shell of `react-big-calendar` with its color-coded visual cues.
- The exact-match slot subtraction logic in `getBookableSlots`.

**What should not be copied back blindly:**
- Do not restore the buggy `custom_hours` computation logic. It needs to be explicitly defined as either a "Break" (subtracting from availability) or "Working Hours Override" (replacing availability entirely).
- Do not restore the hardcoded 30-minute booking logic on the patient frontend.
- Do not restore the staff calendar interaction model where clicking an empty slot defaults to managing availability rules instead of booking an appointment.
- Do not ignore backend validation: The `appointments.service.ts` must be updated to validate availability at the moment of creation to prevent double-booking.

**What should be considered deferred future work / integrated from newer branches:**
- Implementing the "Preserved gains" (direct staff booking, temporary patients, patient dropdowns).
- Refactoring the override system to explicitly handle multiple breaks per day rather than a single `custom_hours` day-level override.