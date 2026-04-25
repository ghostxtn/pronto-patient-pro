# Calendar Styling Discovery

## 1. Stylesheet imports

- `src/main.tsx` imports `src/index.css`.
- `src/index.css` directly imports `react-big-calendar/lib/css/react-big-calendar.css` on line 2.
- The only repo stylesheet that defines `.rbc-*` overrides is `src/index.css`.
- No calendar-specific CSS module or wrapper stylesheet is currently in use.
- Runtime styling is split between:
  - the vendor stylesheet `react-big-calendar/lib/css/react-big-calendar.css`
  - global overrides in `src/index.css`
  - inline style objects returned from `eventPropGetter` inside `src/components/calendar/DoctorCalendar.tsx`

## 2. Design tokens

- The project uses the shadcn-style HSL variable pattern for core app tokens:
  - `src/index.css` defines `:root` tokens such as `--background`, `--foreground`, `--card`, `--border`, `--primary`, `--muted`, `--ring`.
  - `tailwind.config.ts` maps those tokens to Tailwind colors via `hsl(var(--...))`.
- The project also uses raw RGB CSS variables for the homepage namespace (`--homepage-*`) and exposes them in Tailwind with `rgb(var(--homepage-...) / <alpha-value>)`.
- Calendar shells and surrounding layout already consume shared HSL tokens through utilities like `bg-card/95`, `border-border/60`, `text-muted-foreground`, and `shadow-soft`.
- The calendar implementation itself is not tokenized consistently. It mixes theme tokens with many raw colors:
  - hardcoded hex values in `DoctorCalendar.tsx` (`APPOINTMENT_STATUS_STYLES`, `OVERRIDE_COLORS`, `AppointmentStatusIcon`)
  - hardcoded hex and `rgba(...)` in `src/index.css` for the toolbar, headers, surfaces, grid lines, events, and now indicator
  - hardcoded hex in `src/pages/staff/StaffDoctors.tsx` for doctor avatar accents and badges
- Conclusion: the app already supports HSL tokens, but the calendar polish layer currently relies on raw colors and will need consolidation into new HSL calendar tokens.

## 3. Current `eventPropGetter` output

Implementation: `src/components/calendar/DoctorCalendar.tsx` defines one `eventPropGetter` and uses it for both `eventPropGetter` and `backgroundEventPropGetter`.

### 3.1 Appointment branches by status

Common branch behavior for `event.type === "appointment"`:

- Class names always include:
  - `scheduler-event`
  - `scheduler-event-appointment`
  - `scheduler-event-appointment-{normalizedStatus}`
- If the appointment is selected, class names also include:
  - `scheduler-event-appointment-selected`
- Common inline return values:
  - `border: 1px solid rgba(0, 0, 0, 0.08)`
  - `borderRadius: 6px`
  - `opacity`: not set
  - CSS variables:
    - `--scheduler-event-background`
    - `--scheduler-event-foreground`
    - `--scheduler-event-accent`

| Status | `backgroundColor` | `border` | `color` | `opacity` | `borderRadius` | Returned class names |
| --- | --- | --- | --- | --- | --- | --- |
| `pending` | `#FFF7ED` | `1px solid rgba(0, 0, 0, 0.08)` | `#9A3412` | not set | `6px` | `scheduler-event scheduler-event-appointment scheduler-event-appointment-pending` plus selected class if active |
| `confirmed` | `#DBEAFE` | `1px solid rgba(0, 0, 0, 0.08)` | `#1E40AF` | not set | `6px` | `scheduler-event scheduler-event-appointment scheduler-event-appointment-confirmed` plus selected class if active |
| `completed` | `#DCFCE7` | `1px solid rgba(0, 0, 0, 0.08)` | `#166534` | not set | `6px` | `scheduler-event scheduler-event-appointment scheduler-event-appointment-completed` plus selected class if active |
| `cancelled` | `#E5E7EB` | `1px solid rgba(0, 0, 0, 0.08)` | `#6B7280` | not set | `6px` | `scheduler-event scheduler-event-appointment scheduler-event-appointment-cancelled` plus selected class if active |
| `blocked` | `#FEE2E2` | `1px solid rgba(0, 0, 0, 0.08)` | `#991B1B` | not set | `6px` | `scheduler-event scheduler-event-appointment scheduler-event-appointment-blocked` plus selected class if active |

Notes:

- The accent color is returned only through `--scheduler-event-accent`, not through `border-left`.
- Cancelled rendering gets the line-through in `CalendarEventContent`, not in `eventPropGetter`.

### 3.2 `availability-surface`

- Class names:
  - `scheduler-event scheduler-event-availability-surface`
- Inline return values:
  - `backgroundColor: rgba(148,163,184,0.12)`
  - `border: 1px solid rgba(148,163,184,0.20)`
  - `color`: not set
  - `opacity`: not set
  - `borderRadius: 4px`
- Extra layout values:
  - `left: 0`
  - `right: 0`
  - `width: 100%`
  - `margin: 0`
  - `marginLeft: 0`
  - `marginRight: 0`
  - `height: 100%`
  - `paddingLeft: 0`
  - `paddingRight: 0`
  - `pointerEvents: none`
  - `zIndex: 0`

### 3.3 `blackout-surface`

- Class names:
  - `scheduler-event scheduler-event-blackout-surface`
- Inline return values:
  - `backgroundColor`: not set
  - `border`: not set
  - `color`: not set
  - `opacity`: not set
  - `borderRadius: 0`
- Extra layout values:
  - `width: 100%`
  - `margin: 0`
  - `height: 100%`
  - `pointerEvents: none`
  - `zIndex: 1`
- Important follow-up: the visual fill is supplied later by CSS in `src/index.css`, not by the getter itself.

### 3.4 `blackout`

- Class names:
  - `scheduler-event scheduler-event-blackout`
  - plus `scheduler-event-override-selected` when selected
- Inline return values:
  - `backgroundColor`: not set
  - `background: linear-gradient(rgba(234, 88, 12, 0.15), rgba(234, 88, 12, 0.15)), white`
  - `border`: not set
  - `color: #ea580c`
  - `opacity`: not set
  - `borderRadius: 6px`
  - CSS variable `--scheduler-event-color: #ea580c`

### 3.5 `custom_hours`

- Class names:
  - `scheduler-event scheduler-event-custom-hours`
  - plus `scheduler-event-override-selected` when selected
- Inline return values:
  - `backgroundColor`: not set
  - `background: linear-gradient(rgba(234, 88, 12, 0.15), rgba(234, 88, 12, 0.15)), white`
  - `border`: not set
  - `color: #ea580c`
  - `opacity`: not set
  - `borderRadius: 6px`
  - CSS variable `--scheduler-event-color: #ea580c`

### 3.6 `draft`

- Class names:
  - `scheduler-event scheduler-event-draft`
- Inline return values:
  - `backgroundColor`: not set
  - `border`: not set
  - `color`: not set
  - `opacity`: not set
  - `borderRadius`: not set
  - `pointerEvents: none`
- Important follow-up: the dashed preview styling is supplied by CSS in `src/index.css`, not by the getter itself.

## 4. Current `backgroundEventPropGetter` output

- `DoctorCalendar.tsx` passes `backgroundEventPropGetter={eventPropGetter}`.
- There is no separate background-event styling function.
- The runtime `backgroundEvents` array currently contains only:
  - `availability-surface`
  - `blackout-surface`
  - `draft`
- That means the background-event getter currently reuses the exact same branch outputs described above, but only those three branches are exercised in practice.

### 4.1 Runtime-used background branches

| Type | `backgroundColor` | `border` | `color` | `opacity` | `borderRadius` | Returned class names |
| --- | --- | --- | --- | --- | --- | --- |
| `availability-surface` | `rgba(148,163,184,0.12)` | `1px solid rgba(148,163,184,0.20)` | not set | not set | `4px` | `scheduler-event scheduler-event-availability-surface` |
| `blackout-surface` | not set inline | not set inline | not set | not set | `0` | `scheduler-event scheduler-event-blackout-surface` |
| `draft` | not set inline | not set inline | not set | not set | not set | `scheduler-event scheduler-event-draft` |

Notes:

- `blackout-surface` picks up its visible overlay from CSS:
  - `background: rgba(55, 65, 81, 0.12) !important`
  - `border: none !important`
  - `border-radius: 2px !important`
- `draft` picks up its visible overlay from CSS:
  - `background-color: rgba(99, 102, 241, 0.12) !important`
  - `border: 2px dashed rgba(99, 102, 241, 0.45) !important`
  - `border-radius: 6px !important`

## 5. Header rendering

- `renderWeekHeader(date)` lives in `src/components/calendar/DoctorCalendar.tsx`.
- It produces the week header cell markup used for:
  - `components.header`
  - `components.dateHeader` in non-month views
- The `PZT 20` structure comes from:
  - `formatCalendarHeaderDay(date)` for the abbreviation
  - `format(date, "d", { locale: tr })` for the date number
- Current header markup:
  - root: `.scheduler-week-header`
  - today modifier: `.scheduler-week-header-today`
  - abbreviation: `.scheduler-week-header-day`
  - date number: `.scheduler-week-header-date`
  - slot/meta row: `.scheduler-week-header-meta`
  - separator dot: `.scheduler-week-header-sep`
  - booked count: `.scheduler-week-header-booked`
- The "today" circle is styled entirely in CSS:
  - `.scheduler-week-header-today .scheduler-week-header-date`
  - current treatment: blue filled circle with white text
- The placeholder dash for no-slot days is currently injected with an inline color:
  - `style={{ color: "#d1d5db" }}`
- The "selected day" state is not currently applied anywhere:
  - `resolvedCurrentDate` controls the active date and visible range
  - no class, inline style, or data attribute is attached to the matching week header cell
  - no class, inline style, or data attribute is attached to the matching day column
  - the only built-in day-state class available today is `rbc-today`, which marks the real current day, not `resolvedCurrentDate`

## 6. Time gutter and grid

Current styling source: `src/index.css`.

### 6.1 Time gutter

- `.scheduler-calendar-shell .rbc-time-gutter`
  - `background: #ffffff`
  - `width: 72px`
  - `min-width: 72px`
  - mobile override: `56px`
- `.scheduler-calendar-shell .rbc-time-gutter .rbc-timeslot-group`
  - `background: #ffffff`
- `.scheduler-calendar-shell .rbc-label`
  - `font-size: 11px`
  - `font-weight: 400`
  - `color: #9ca3af`
  - `text-align: right`
  - `transform: translateY(-6px)` to align labels upward inside the row

### 6.2 Horizontal grid

- Shared border color assignment:
  - `.rbc-header`
  - `.rbc-time-header-content`
  - `.rbc-time-header`
  - `.rbc-time-content`
  - `.rbc-time-view`
  - `.rbc-agenda-view`
  - `.rbc-timeslot-group`
  - `.rbc-day-slot .rbc-time-slot`
  - `.rbc-month-view`
  - `.rbc-month-row + .rbc-month-row`
  - current `border-color: rgba(0, 0, 0, 0.06)`
- `.scheduler-calendar-shell .rbc-timeslot-group`
  - `min-height: 60px`
  - `background: #ffffff`
  - `border-top: 1px solid rgba(0, 0, 0, 0.06)`
- `.scheduler-calendar-shell .rbc-day-slot .rbc-time-slot`
- `.scheduler-calendar-shell .rbc-time-slot`
  - `border-top: 1px solid rgba(0, 0, 0, 0.03)`

### 6.3 Vertical separators

- `.scheduler-calendar-shell .rbc-day-bg + .rbc-day-bg`
  - `border-left: 1px solid rgba(0, 0, 0, 0.06)`
- `.scheduler-calendar-shell .rbc-time-content > * + * > .rbc-day-slot`
- `.scheduler-calendar-shell .rbc-time-content > * + * > .rbc-day-bg`
  - `border-left: 1px solid rgba(0, 0, 0, 0.06)`

### 6.4 Header/background surfaces

- `.scheduler-calendar-shell .rbc-header`
  - `background: #ffffff`
  - `padding: 8px 4px`
  - `color: #6b7280`
- `.scheduler-calendar-shell .rbc-time-header`
  - `background: #ffffff`
  - `box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.08)`
- `.scheduler-calendar-shell .rbc-time-header-content`
  - `background: #ffffff`
- `.scheduler-calendar-shell .rbc-time-content`
  - `background: #ffffff`

## 7. Now-indicator

- `react-big-calendar`'s built-in now indicator class is `.rbc-current-time-indicator`.
- It is currently hidden by an explicit override in `src/index.css`:
  - `.scheduler-calendar-shell .rbc-current-time-indicator { display: none; }`
- The app currently renders its own replacement indicator with `createPortal(...)` from `DoctorCalendar.tsx`.
- Current custom indicator details:
  - class: `.scheduler-current-time-indicator`
  - rendered only in `week` and `day` views
  - portal target: `.rbc-time-content`
  - only shown when a today column exists and the current time falls between calendar start/end minutes
  - style:
    - line height: `2px`
    - line color: `#dc2626`
    - dot: `10px` red circle
    - dot shadow: none
- Bottom line: the currently visible now-indicator is custom, not the native `.rbc-current-time-indicator`.

## 8. Toolbar

`CustomToolbar` in `src/components/calendar/DoctorCalendar.tsx` currently renders:

- identity block
  - avatar circle
  - doctor name
  - specialization badge
- center cluster
  - previous chevron button
  - date-range label
  - next chevron button
  - `Bugun` button
- right cluster
  - view switcher dropdown trigger (`Ay`, `Hafta`, `Gun`, `Ajanda`)
  - `Musaitlik Paneli` button

### 8.1 Current sizing and border treatment

- Avatar:
  - `.scheduler-toolbar-avatar`
  - `36px x 36px`
  - `border-radius: 50%`
  - `background-color: #2563eb`
  - `color: white`
- Date-range label:
  - `.scheduler-toolbar-title`
  - plain text span, not actually a pill today
  - `font-size: 15px`
  - `font-weight: 600`
  - `min-width: 160px`
  - no border, no background, no explicit height
- Nav chevrons:
  - `Button` with `variant="ghost"` and `size="icon"`
  - `.scheduler-toolbar-nav-button`
  - `36px x 36px`
  - `border: none`
  - `background: transparent`
  - `border-radius: 9999px`
  - `color: #4b5563`
- Today button:
  - `Button` with `variant="ghost"`
  - `.scheduler-toolbar-today-button`
  - `min-height: 36px`
  - `border: 1px solid #d1d5db`
  - `background: transparent`
  - `border-radius: 9999px`
  - `color: #374151`
- View switcher trigger:
  - `Button` with `variant="outline"`
  - `.scheduler-toolbar-view-button`
  - `min-height: 36px`
  - `border: 1px solid #d1d5db`
  - `background: #ffffff`
  - `border-radius: 9999px`
  - `color: #374151`
- `Musaitlik Paneli` button:
  - `Button` with `variant="outline"`
  - `.scheduler-toolbar-manage-button`
  - `min-height: 36px`
  - `border: 1px solid #d1d5db`
  - `background: #ffffff`
  - `border-radius: 9999px`
  - `color: #374151`

### 8.2 Token source summary

- Layout spacing mostly comes from utility classes and custom CSS.
- Border/background colors are not derived from dedicated calendar tokens today.
- Most toolbar chrome uses raw `#d1d5db`, `#ffffff`, `#374151`, and `#4b5563`.
- Focus styling still comes from the underlying shadcn `Button` component unless overridden by the button variant styles.

## 9. Left sidebar card (`Doktor Odagi`)

- The left sidebar rail is rendered in `src/pages/staff/StaffDoctors.tsx`.
- The specific `Doktor Odagi` card lives inside the `StaffSchedulerRail` component.

### 9.1 Outer rail container

- Root wrapper:
  - `rounded-[32px]`
  - `border border-border/60`
  - `bg-card/95`
  - `shadow-soft`

### 9.2 `Doktor Odagi` inner card

- Mini-month card:
  - `rounded-[26px]`
  - `border border-border/60`
  - `bg-background/72`
  - `p-3`
  - `shadow-soft`
- `Bugun` rail button:
  - `variant="outline"`
  - `size="sm"`
  - `rounded-full border-border/60 bg-card`

### 9.3 `Secili Doktor` block

- `SelectedDoctorContext` in the same file renders the active doctor block.
- Current active block treatment:
  - `rounded-[24px]`
  - `border border-primary/15`
  - `bg-primary/5`
  - no dedicated ring
  - no custom shadow
- The avatar inside this block uses an inline hardcoded fill:
  - `backgroundColor: #65a98f`

### 9.4 Mini-month date styling

- The mini-month is passed custom `classNames` directly from `StaffDoctors.tsx`.
- Current noteworthy states:
  - `day`: `hover:bg-accent/70`
  - `day_today`: `bg-accent text-accent-foreground`
  - `day_selected`: `bg-primary text-primary-foreground`
  - no staff-page-specific override for disabled/outside dates beyond the base `Calendar` component defaults

## Phase 2 readiness

### Item 2.3: selected-day column wash and borders

- Current structure does not expose a reliable class for the `resolvedCurrentDate` column.
- `react-big-calendar` gives `rbc-today`, but that only marks the real calendar day, not the focused day derived from `resolvedCurrentDate`.
- Minimal structural workaround:
  - add a DOM-sync effect in `DoctorCalendar.tsx`
  - compute the focused day index from `resolvedCurrentDate`
  - toggle `data-calendar-active-day="true"` on the matching:
    - `.rbc-time-header-content .rbc-header`
    - `.rbc-day-bg`
    - `.rbc-day-slot`
  - clear the attribute on rerender/unmount

### Item 2.4: built-in now-indicator

- The current implementation explicitly hides `.rbc-current-time-indicator` and replaces it with a custom portal line.
- Minimal structural workaround:
  - stop hiding `.rbc-current-time-indicator`
  - remove or disable the custom portal indicator path
  - style the native `.rbc-current-time-indicator` directly, including its left-edge dot

### Item 2.5: appointment status icon must follow row text color

- `AppointmentStatusIcon` currently hardcodes its colors in JSX (`#2563eb`, `#CA8A04`, `#16A34A`, `#9CA3AF`, `#fff`).
- Minimal structural workaround:
  - move icon colors to CSS variables or `currentColor`
  - feed the icon from the event row's computed text/accent color instead of hardcoded per-icon fills

### Item 2.10: toolbar date-range pill

- The current date range is plain text, not a discrete pill-shaped control.
- Minimal structural workaround:
  - wrap the title span in a dedicated pill element or restyle the existing title span to carry the shared `36px` toolbar chrome without changing navigation logic

No backend, API, type, scheduling, availability-window, or `OverrideModal.tsx` business-logic blockers were found during discovery. The required work is isolated to front-end tokens, `DoctorCalendar.tsx`, `src/index.css`, and the staff sidebar surface in `src/pages/staff/StaffDoctors.tsx`.
