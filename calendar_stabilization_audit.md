# Calendar Stabilization Audit

## 1. Scope
This audit strictly covers the calendar and appointment-booking stabilization scope, comparing the current project state against the provided `calendar_truth_baseline.md`. The files audited include backend core services for availability and appointments, database schema changes for overrides, frontend calendar components, and the patient booking portal.

## 2. Baseline reference used
`calendar_truth_baseline.md`

## 3. Immediate stabilization priorities
1. **Restore database-level constraints:** Re-establish the unique constraint on doctor availability overrides to prevent conflicting data states (e.g., overlapping custom hours and blackouts).
2. **Remove complex backend merge logic:** The newly introduced `buildAvailabilityMergePlan` and `buildCustomHoursMergePlan` are highly complex, brittle, and explicitly not a priority ("same-day multi-block is NOT priority right now", "weekly availability merge is NOT priority right now"). Return to strict 409 Conflict rejections for overlapping slots.
3. **Fix semantic UI mismatch:** The `custom_hours` override operates as a break (subtracting time) on the backend, but the UI labels it as "Özel saat belirle" (Set custom hours). Rename this in the UI to reflect its true behavior (e.g., "Mola / Blok Ekle").
4. **Simplify frontend calendar math:** Remove the manual DOM coordinate math (`getQuickActionPosition`) in `DoctorCalendar.tsx` which is prone to layout shifts and mobile rendering issues.

## 4. Deferred high-risk backend changes
- **Same-day multi-block overrides:** The attempt to support multiple breaks or custom hour blocks on the exact same day via `0012_split_custom_hours.sql` and `buildCustomHoursMergePlan` has introduced significant instability and race-condition risks. This should be deferred.
- **Weekly availability auto-merging:** Automatically merging adjacent or overlapping weekly recurring availability blocks (`buildAvailabilityMergePlan`) is not a current priority and complicates the service layer unnecessarily.

## 5. Per-file verdicts

### `backend/src/availability/availability.service.ts`
- **What changed:** Introduced `buildAvailabilityMergePlan` to automatically merge overlapping or touching weekly availability blocks instead of rejecting them.
- **Why it may have been attempted:** To provide a smoother UX where staff can create adjacent blocks and the system consolidates them.
- **What risk it introduces:** High logic complexity. Infinite loops or incorrect slot consolidations if durations differ. It violates the "weekly availability merge is NOT priority right now" directive.
- **Verdict:** HYBRID
- **Exact recommendation:** KEEP the exact-match slot subtraction in `getBookableSlots`. REVERT the `buildAvailabilityMergePlan` logic in `create` and `update` back to the baseline's strict `409 Conflict` behavior when an overlap is detected.

### `backend/src/availability-overrides/availability-overrides.service.ts`
- **What changed:** Added `buildCustomHoursMergePlan` to merge overlapping daily overrides.
- **Why it may have been attempted:** To support same-day multi-block overrides (multiple breaks in one day).
- **What risk it introduces:** Brittle time-computation logic that assumes the database constraint has been dropped, leading to potential data corruption and overlapping overrides.
- **Verdict:** REVERT
- **Exact recommendation:** REVERT the `buildCustomHoursMergePlan` entirely. Go back to strict validation ensuring only one override type per day, matching the baseline. 

### `backend/src/appointments/appointments.service.ts`
- **What changed:** Added a critical `hasOverlap` check in the `create` method to prevent booking an appointment if the doctor already has a non-cancelled appointment in that time range.
- **Why it may have been attempted:** To fix the critical TOCTOU (Time-of-Check to Time-of-Use) double-booking vulnerability mentioned in the baseline.
- **What risk it introduces:** Very low risk; this is a necessary data-integrity guardrail.
- **Verdict:** KEEP
- **Exact recommendation:** KEEP the newly added `hasOverlap` and `dto.startTime >= dto.endTime` validations. This is a massive stability gain.

### `backend/src/database/schema/doctor-availability-overrides.schema.ts` & `backend/drizzle/0012_split_custom_hours.sql`
- **What changed:** Dropped the `doctor_availability_overrides_doctor_date_type_unique` constraint via the `0012` migration.
- **Why it may have been attempted:** To allow multiple `custom_hours` records on the same day for same-day multi-block support.
- **What risk it introduces:** Database-level data corruption where a doctor can have overlapping blackouts and custom hours on the same day.
- **Verdict:** REVERT
- **Exact recommendation:** REVERT the schema to include the unique constraint on `(doctor_id, date, type)`. Delete the `0012_split_custom_hours.sql` migration or create a new migration to restore the constraint.

### `src/components/calendar/DoctorCalendar.tsx`
- **What changed:** Massive expansion of functionality. Added `QuickActionState`, manual DOM coordinate math for popups, and `reopenQuickBlock` logic to split overrides.
- **Why it may have been attempted:** To allow direct calendar interaction for block placement and inline appointment creation (preserved gains).
- **What risk it introduces:** The manual popup coordinate math (`getQuickActionPosition`) is highly unstable across responsive breakpoints. The `reopenQuickBlock` mutation assumes the backend supports same-day multi-blocks, which we are reverting.
- **Verdict:** HYBRID
- **Exact recommendation:** KEEP the inline appointment composer (`createAppointmentFromCalendar`) and patient search directly from the calendar grid. REVERT the manual `getQuickActionPosition` math and use standard centered modals or UI library popovers. REVERT the `reopenQuickBlock` split logic since the backend will no longer support multiple custom_hours per day.

### `src/components/calendar/AvailabilityModal.tsx`
- **What changed:** Added `onDraftChange` to provide a live visual preview of the availability block on the calendar before saving.
- **Why it may have been attempted:** UX enhancement.
- **What risk it introduces:** Low risk, pure client-side visual state.
- **Verdict:** KEEP
- **Exact recommendation:** KEEP this component as is. The live preview is a solid UI gain.

### `src/components/calendar/OverrideModal.tsx`
- **What changed:** Minor state adjustments, but still uses the label "Özel saat belirle".
- **Why it may have been attempted:** Standard evolution of the form.
- **What risk it introduces:** The label contradicts the backend behavior (which subtracts the time as a break).
- **Verdict:** HYBRID
- **Exact recommendation:** KEEP the component structure, but explicitly change the UI label text from "Özel saat belirle (Custom hours)" to "Mola / Blok Ekle" to accurately reflect that the backend subtracts these hours.

### `src/pages/DoctorProfile.tsx`
- **What changed:** Implemented `react-day-picker` but still hardcodes appointment durations to 30 minutes on submission: `addMinutes(parse(selectedSlot, "HH:mm", new Date()), 30)`.
- **Why it may have been attempted:** Lack of `slot_duration` exposure from the backend's `/availability/slots` endpoint.
- **What risk it introduces:** Appointments will always be saved as 30 minutes, even if the doctor's active availability block dictates 15 or 45 minutes, leading to grid misalignment.
- **Verdict:** HYBRID
- **Exact recommendation:** KEEP the `react-day-picker` booking flow, but REVERT the hardcoded 30-minute logic. The frontend must be updated to respect the actual `slot_duration` of the doctor's availability. 

### `src/services/api.ts`
- **What changed:** General endpoint wire-ups.
- **Why it may have been attempted:** Normal API growth.
- **What risk it introduces:** Low.
- **Verdict:** KEEP
- **Exact recommendation:** KEEP as is.

### `src/utils/calendarUtils.ts`
- **What changed:** Refined parsing logic for `react-big-calendar` events.
- **Why it may have been attempted:** To handle date-fns localization and edge cases better.
- **What risk it introduces:** Low.
- **Verdict:** KEEP
- **Exact recommendation:** KEEP as is.

### `src/index.css`
- **What changed:** Heavy use of CSS variables and `!important` tags targeting `react-big-calendar`.
- **Why it may have been attempted:** To force the third-party calendar library to match the local design system.
- **What risk it introduces:** CSS specificity wars leading to visual bugs, specifically event overflow.
- **Verdict:** HYBRID
- **Exact recommendation:** KEEP the color variables, but clean up the `!important` flags that interfere with `react-big-calendar`'s default layout calculations.

## 6. Compile / runtime risk notes
- **High Risk:** The manual coordinate math in `DoctorCalendar.tsx` (`getQuickActionPosition`) is a massive risk for runtime rendering errors, especially on mobile or resizing windows.
- **High Risk:** The `reopenQuickBlock` function in `DoctorCalendar.tsx` attempts to "split" an override into two separate overrides. Because we are reverting `0012_split_custom_hours.sql` (restoring the unique constraint), this function will cause database constraint errors if executed.
- **High Risk:** The backend merge plans (`buildAvailabilityMergePlan`, `buildCustomHoursMergePlan`) are over-engineered and likely to cause unexpected slot creation or infinite loops if data is malformed.

## 7. Preserved gains
The following useful newer capabilities discovered during the audit should be explicitly kept:
- **Backend Appointment Validation:** The `hasOverlap` check in `appointments.service.ts` is a massive security/stability win that prevents double-booking.
- **Inline Staff Booking:** The ability for staff to click the calendar grid to instantly create an appointment (via `createAppointmentFromCalendar`) and search patients directly from the UI.
- **Draft Previews:** The `onDraftChange` visual preview when creating weekly availability rules.

## 8. Next UI-only fixes
Once the backend logic and database constraints are stabilized, the following visible calendar bugs need to be addressed:
- event overflow in week/day view
- month view same-day overflow behavior
- weak appointment detail panel contrast