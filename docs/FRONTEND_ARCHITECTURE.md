# Frontend Theme and Styling Architecture Report

## 1. Entry Point and App Bootstrap

### `src/main.tsx`

- The app imports `App` and `src/index.css`, disables browser scroll restoration when supported, and mounts React with `createRoot(document.getElementById("root")!).render(<App />)`.
- There is no `StrictMode` wrapper in the current entry file.
- No clinic data or theme data is fetched directly in `main.tsx`.

### `src/App.tsx`

- Root providers are composed in this order: `ThemeProvider`, `QueryClientProvider`, `TooltipProvider`, `BrowserRouter`, `LanguageProvider`, `AuthProvider`, then `AppRoutes`.
- `ThemeProvider` is imported from `src/components/ThemeProvider.tsx` and wraps `next-themes`.
- `QueryClient` is created once at module scope with default settings.
- Route transitions are wrapped in `AnimatePresence` from Framer Motion.
- Toast systems are mounted globally through `src/components/ui/toaster` and `src/components/ui/sonner`.
- There is no root-level clinic provider or clinic theme provider.
- The root auth bootstrap is in `AuthProvider`, not in `App.tsx` itself.

### First API Call on App Boot

- `src/contexts/AuthContext.tsx` runs an auth bootstrap effect on mount:
  - First explicit bootstrap request: `api.auth.refresh()`, which calls `POST /auth/refresh`.
  - On success, it calls `api.auth.me()`, which calls `GET /auth/me`.
- Public landing components also mount `useHomepagePreviewData`, which requests `GET /homepage-preview`; depending on React Query scheduling and route, this can run during the initial public page mount. The auth provider's coded bootstrap sequence still begins with `/auth/refresh`.
- No `clinics/current` request is made at the root app level.

## 2. Clinic Data Usage

### `src/services/api.ts`

- Clinic API methods are defined under `api.clinics`:
  - `list()` -> `GET /clinics`
  - `current()` -> `GET /clinics/current`
  - `get(id)` -> `GET /clinics/:id`
  - `create(data)` -> `POST /clinics`
  - `update(id, data)` -> `PATCH /clinics/:id`
  - `uploadLogo(id, file)` -> `PATCH /clinics/:id/logo`
- Every request adds `X-Clinic-Domain` using `window.location.hostname`; local hosts map to `test-klinik.localhost`.
- `api.homepagePreview.get()` calls `GET /homepage-preview` and types a `clinic` object with `name`, `phone`, `email`, `address`, `logo_url`, `default_appointment_duration`, `appointment_approval_mode`, `max_booking_days_ahead`, and `cancellation_hours_before`.

### `src/hooks/useClinicBranding.ts`

- Fetches `api.clinics.current()` with query key `["clinic-branding"]`.
- Used fields:
  - `name`
  - `logo_url`
  - `updated_at`
- Returns `clinicName`, cache-busted `logoUrl`, and raw `clinic`.
- This is branding logic, but only for name/logo. It does not set CSS variables or theme tokens.

### `src/components/AppLayout.tsx`

- Calls `useClinicBranding()`.
- Uses clinic `logo_url` and `name` in the authenticated app header.
- Falls back to the static MediBook mark with hardcoded SVG fills `#65a98f` and `#4f8fe6`.

### `src/pages/admin/ClinicSettings.tsx`

- Fetches `api.clinics.current()` with query key `["clinic", "current"]`.
- Used fields:
  - `id`
  - `name`
  - `phone`
  - `email`
  - `address`
  - `logo_url`
  - `updated_at`
  - `default_appointment_duration`
  - `appointment_approval_mode`
  - `max_booking_days_ahead`
  - `cancellation_hours_before`
- Supports updating clinic profile, appointment settings, and logo upload.
- Invalidates `["clinic", "current"]`, `["clinic", user.clinic_id]`, and `["clinic-branding"]` after writes.

### `src/pages/MyAppointments.tsx`

- Fetches `api.clinics.current()` with query key `["clinic-settings"]`.
- Uses `cancellation_hours_before`, defaulting to `24`, to decide whether a patient can cancel an appointment.

### Public Homepage and Public Pages

- `src/hooks/useHomepagePreviewData.ts` fetches `api.homepagePreview.get()` and shapes doctors/specialties through `src/lib/homepage-preview.ts`.
- `src/components/landing/LandingNav.tsx`, `src/components/landing/HeroSection.tsx`, `src/components/landing/LandingFooter.tsx`, `src/pages/Auth.tsx`, and `src/pages/ContactPage.tsx` use clinic data from `homepage-preview`.
- Used public clinic fields:
  - `name`
  - `logo_url`
  - `updated_at`
  - `phone`
  - `email`
  - `address`
- Existing theming from clinic data is limited to swapping logo/name/contact details. There is no clinic-driven palette, typography, radius, or CSS-variable injection.

### Multi-Theme Relevance

- Good foundation: clinic identity is already fetched in both authenticated and public surfaces.
- Gap: clinic data is fetched in multiple isolated queries instead of one root branding/theme source.
- Gap: clinic API response currently used by frontend does not expose theme tokens such as primary color, secondary color, font, radius, or landing palette.

## 3. CSS Architecture

### `src/index.css`

- Imports Google fonts:
  - `Manrope`
  - `Plus Jakarta Sans`
  - `Space Grotesk`
- Imports `react-big-calendar/lib/css/react-big-calendar.css`.
- Uses Tailwind layers: `base`, `components`, and `utilities`.
- Defines a large CSS custom property system under `:root` and `.dark`.
- Uses HSL triplet variables for shadcn-style app colors, RGB triplet variables for homepage colors, and HSL variables for calendar colors.
- Defines utility classes such as `glass`, `glass-strong`, `landing-glass`, `gradient-text`, `shadow-soft`, `homepage-shell-gradient`, `homepage-focus`, and many scheduler/calendar classes.

### Core CSS Variables

- App/shadcn tokens: `--background`, `--foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground`, `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring`, `--radius`.
- Sidebar tokens: `--sidebar-background`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-accent`, `--sidebar-accent-foreground`, `--sidebar-border`, `--sidebar-ring`.
- Semantic tokens: `--success`, `--success-foreground`, `--warning`, `--warning-foreground`, `--info`, `--info-foreground`.
- Landing legacy tokens: `--landing-bg`, `--landing-fg`, `--landing-muted`, `--landing-card`, `--landing-border`.
- Homepage tokens: `--homepage-brand`, `--homepage-brand-deep`, `--homepage-support`, `--homepage-support-tint`, `--homepage-shell`, `--homepage-shell-cool`, `--homepage-skeleton-1`, `--homepage-skeleton-2`, `--homepage-skeleton-3`, `--homepage-card`, `--homepage-ink`, `--homepage-text`, `--homepage-muted`, `--homepage-soft`, `--homepage-border`, `--homepage-info-border`, `--homepage-border-strong`, `--homepage-brand-strong`, `--homepage-success`, `--homepage-warning`, `--homepage-warning-bg`, `--homepage-critical`, `--homepage-footer-bg-from`, `--homepage-footer-bg-mid`, `--homepage-footer-bg-to`, `--homepage-footer-border`, `--homepage-footer-text`, `--homepage-footer-muted`.
- Gradient/shadow tokens: `--homepage-shell-gradient`, `--homepage-section-gradient`, `--homepage-hero-scrim`, `--homepage-hero-bottom-scrim`, `--homepage-footer-gradient`, `--homepage-card-shadow`, `--homepage-hero-shadow`, `--gradient-primary`, `--gradient-secondary`, `--gradient-hero`, `--shadow-soft`, `--shadow-card`, `--shadow-elevated`.
- Calendar tokens include `--calendar-surface`, `--calendar-gutter`, `--calendar-grid-strong`, `--calendar-grid-soft`, `--calendar-grid-vertical`, `--calendar-selected-wash`, `--calendar-selected-border`, `--calendar-selected-header`, `--calendar-today-accent`, `--calendar-toolbar-border`, `--calendar-muted`, `--calendar-gutter-fg`, `--calendar-muted-soft`, `--calendar-disabled`, `--calendar-shadow`, `--calendar-event-outline`, appointment status color tokens, availability tokens, blackout tokens, custom-hours tokens, sidebar tokens, and `--calendar-mini-hover`.
- Runtime scheduler variables such as `--slot-height`, `--scheduler-event-background`, `--scheduler-event-foreground`, `--scheduler-event-accent`, and `--scheduler-event-muted-foreground` are used later in the calendar CSS.

### `tailwind.config.ts`

- `darkMode: ["class"]`, aligned with `next-themes`.
- Extends fonts:
  - `font-display`: `Space Grotesk`
  - `font-body`: `Plus Jakarta Sans`
- Maps app, semantic, sidebar, and homepage Tailwind color names to CSS variables.
- Does not map all calendar variables into Tailwind colors; many calendar styles are direct CSS in `index.css`.
- Adds radius tokens from `--radius`.
- Adds accordion, float, and pulse-soft keyframes.

### Design Token System Assessment

- Yes, there is a partial design token system:
  - Strong token support for shadcn-style app UI.
  - Separate token namespace for homepage.
  - Separate token namespace for scheduler/calendar.
  - Light/dark variants via `:root` and `.dark`.
- Missing for multi-theme:
  - No per-clinic token loading.
  - No theme schema/type for persisted clinic palettes.
  - No runtime CSS-variable application from API data.
  - Some pages still use hardcoded hex colors and inline font families, especially auth and landing card sections.

## 4. Layout Structure

### Layout Files

- No `src/layouts/` directory exists.
- Layout equivalents are component-based:
  - `src/components/AppLayout.tsx`
  - `src/components/landing/PublicPageLayout.tsx`
  - `src/components/auth/AuthScreen.tsx`
  - Direct landing shell in `src/pages/Landing.tsx`

### `src/components/AppLayout.tsx`

- Authenticated application layout.
- Provides sticky glass header, role-based navigation, clinic logo/name, language switcher, theme toggle, logout, and responsive mobile menu.
- Used by patient, doctor, staff, admin, and owner pages.
- Role-specific nav links are computed locally in this component.

Routes/pages using `AppLayout`:

- Patient: `Dashboard`, `MyAppointments`, `Profile`, patient route version of `FindDoctors`, `DoctorProfile`.
- Doctor: `DoctorDashboard`, `DoctorSchedule`, `DoctorAppointments`, `DoctorPatients`, `DoctorPatientDetail`.
- Staff: `StaffDashboard`, `StaffDoctors`, `ManagePatients`, `ManageAppointments`.
- Admin/owner: `AdminDashboard`, `ManageDoctors`, `ManageStaff`, `ManagePatients`, `ManageAppointments`, `ClinicSettings`, `OwnerDashboard`.

### `src/components/landing/PublicPageLayout.tsx`

- Public informational page layout.
- Wraps content with `LandingNav`, `LandingFooter`, homepage shell gradient, Framer Motion transition, and homepage token colors.
- Used by `ContactPage`, `AppointmentProcessPage`, and `LocalizedContentPage`.
- `LocalizedContentPage` is used by public legal/information pages such as `WhyMedibook`, `About`, `Faq`, `PatientRights`, `Accessibility`, and legal pages.

### `src/components/auth/AuthScreen.tsx`

- Auth-related layout for `ForgotPassword` and `ResetPassword`.
- Uses Framer Motion, theme toggle, language switcher, and hardcoded gradient/brand colors.
- Separate from `src/pages/Auth.tsx`, which implements its own larger auth screen.

### Direct Public Landing Layouts

- `src/pages/Landing.tsx` builds its own landing shell with `LandingNav`, `HeroSection`, `SpecialtiesSection`, `DoctorsSection`, and `LandingFooter`.
- `src/pages/FindDoctors.tsx` and `src/pages/Specialties.tsx` use landing nav/footer directly when public, and `FindDoctors` switches to `AppLayout` when rendered under `/patient/doctors`.

## 5. Homepage / Landing Page

### `src/pages/Landing.tsx`

- Main sections:
  - `LandingNav`
  - `HeroSection`
  - `SpecialtiesSection`
  - `DoctorsSection`
  - `LandingFooter`
- Uses Framer Motion for page transition.
- Uses Tailwind classes and inline styles.
- Page colors are mostly homepage CSS variables, e.g. `bg-homepage-shell`, `text-homepage-ink`, `rgb(var(--homepage-shell))`.
- Contains inline layout styles for z-index, border radius, negative margin, and section shell.

### `src/components/landing/HeroSection.tsx`

- Uses clinic name/logo from `useHomepagePreviewData`.
- Uses `next-themes` `resolvedTheme` to switch between `/hero-animation.mp4` and `/Darkmode-animation.mp4`.
- Uses Lenis smooth scroll and direct DOM style mutation for scroll progress animation.
- Uses CSS classes such as `hero-section`, `hero-sticky-bg`, `hero-video-bg`, `hero-content`, and `hero-cta-btn`; these are styled in `src/index.css`.
- Hardcoded colors exist in fallback SVG fills and scroll icon stroke: `#65a98f`, `#4f8fe6`, `#5a7a8a`.

### `src/components/landing/LandingNav.tsx`

- Uses clinic name/logo from `useHomepagePreviewData`.
- Uses Tailwind homepage token classes: `bg-homepage-shell`, `border-homepage-border`, `text-homepage-muted`, `text-homepage-ink`, `bg-homepage-brand`.
- Has hardcoded fallback SVG colors `#65a98f` and `#4f8fe6`.
- User avatar fallback uses inline `color: "#4f8fe6"`.

### `src/components/landing/SpecializationsSection.tsx` and `DoctorsSection.tsx`

- Use Framer Motion and `useInView`.
- Mix Tailwind, inline styles, homepage variables, and hardcoded fallback gradients.
- Hardcoded colors include gradients like `#eaf5ff`, `#c8e6f5`, `#b5d1cc`, skeleton colors like `#eef4fb`, and CTA colors like `#4f8fe6` / `#2f75ca`.

### `src/components/landing/LandingFooter.tsx`

- Uses clinic name/logo from homepage preview.
- Mostly uses homepage CSS variables through `hsl(var(...))` and `rgb(var(...))`.
- Uses inline gradient from footer CSS variables.

### `src/pages/Auth.tsx` and `src/components/auth/AuthScreen.tsx`

- Both contain auth surfaces with many hardcoded colors and inline font families.
- `src/pages/Auth.tsx` uses clinic logo/name from homepage preview.
- `src/components/auth/AuthScreen.tsx` still displays static `Pronto Klinik` and static SVG colors.
- These are important migration targets for a multi-theme system.

### Multi-Theme Relevance

- Homepage has a dedicated token namespace and already consumes tokenized colors in many places.
- Hardcoded colors and inline styles are still common in landing/auth cards and fallback SVGs.
- Fonts are globally tokenized through Tailwind, but several components override with inline `Manrope` or `Inter`.

## 6. Role-Based UI

### `src/contexts/AuthContext.tsx`

- Central role state lives in `AuthContext`.
- `User.role` is normalized to one of `owner`, `admin`, `staff`, `doctor`, or `patient`.
- Also stores `clinic_id`, `avatar_url`, and `default_appointment_duration`.

### `src/lib/auth-routing.ts`

- Defines `AppRole`.
- Maps default routes:
  - `owner` -> `/admin/dashboard`
  - `admin` -> `/admin/dashboard`
  - `staff` -> `/staff/dashboard`
  - `doctor` -> `/doctor/dashboard`
  - `patient` -> `/patient/dashboard`

### Route Guards

- `src/components/auth/RequireAuth.tsx`: redirects unauthenticated users to `/auth`.
- `src/components/auth/RequireRole.tsx`: enforces role allow-lists and redirects users to their default route.
- `src/components/auth/RequireDoctorAccess.tsx`: allows doctors, and also owner/admin users with an active doctor profile from `api.doctors.me()`.

### `src/App.tsx` Role-Based Routes

- Patient-only routes: `/patient/dashboard`, `/patient/profile`, `/patient/doctors`, `/patient/doctors/:id`, `/patient/appointments`.
- Doctor access routes: `/doctor/dashboard`, `/doctor/schedule`, `/doctor/appointments`, `/doctor/patients`, `/doctor/patients/:id`.
- Owner/admin routes: `/admin/dashboard`, `/admin/doctors`, `/admin/staff`, `/admin/settings`.
- Owner/admin/staff routes: `/staff/dashboard`, `/staff/doctors`, `/admin/patients`, `/admin/appointments`.
- Owner-only route: `/owner/dashboard`.

### Role-Dependent Components

- `src/components/AppLayout.tsx` changes nav links, home route, role label, and optional doctor panel link based on role.
- `src/components/landing/LandingNav.tsx` changes dashboard destination based on logged-in user role.
- `src/pages/admin/ClinicSettings.tsx` changes visible settings sections/actions based on owner/admin capabilities.
- `src/pages/FindDoctors.tsx` changes layout depending on whether it is public or under `/patient/doctors`.
- Doctor scheduling and staff doctor views use specialized calendar layouts.

### Multi-Theme Relevance

- Role UI is centralized enough for layout-level theme switching.
- Theme is not role-specific today; role affects navigation and access, not palette or styling tokens.

## 7. Existing Component Library Usage

### shadcn/ui Components Present

Files exist under `src/components/ui/` for:

- `accordion`
- `alert-dialog`
- `alert`
- `avatar`
- `badge`
- `button`
- `calendar`
- `card`
- `chart`
- `checkbox`
- `collapsible`
- `command`
- `dialog`
- `drawer`
- `dropdown-menu`
- `form`
- `input-otp`
- `input`
- `label`
- `popover`
- `progress`
- `radio-group`
- `select`
- `separator`
- `sheet`
- `skeleton`
- `sonner`
- `switch`
- `table`
- `tabs`
- `textarea`
- `toast`
- `toaster`
- `toggle`
- `tooltip`

### shadcn/ui Components Used in App Code

Observed imports include:

- Frequently used: `button`, `badge`, `card`, `input`, `label`, `dialog`, `select`, `textarea`, `calendar`, `tabs`, `skeleton`.
- Layout/utilities: `tooltip`, `dropdown-menu`, `avatar`, `separator`, `drawer`, `sheet`, `switch`.
- Calendar modals: `alert`, `alert-dialog`, `popover`, `radio-group`.
- Auth: `input-otp`.
- Global app shell: `toaster`, `sonner`, `tooltip`.
- Public content: `accordion`.
- Present but not clearly used outside ui internals in this scan: `chart`, `checkbox`, `collapsible`, `command`, `form`, `progress`, `table`, `toggle`.

### Framer Motion Usage

- Framer Motion is used broadly:
  - `src/App.tsx` for route `AnimatePresence`.
  - `src/components/AppLayout.tsx` and `LandingNav.tsx` for mobile menu animations.
  - `src/pages/Landing.tsx`, public pages, auth pages, dashboards, admin pages, doctor pages, and staff pages for page/section/card transitions.
  - `src/components/landing/DoctorsSection.tsx` and `SpecializationsSection.tsx` use `motion` and `useInView`.

### react-big-calendar Usage

- CSS is imported globally in `src/index.css`.
- Core calendar component: `src/components/calendar/DoctorCalendar.tsx`.
- Calendar views/types are imported in:
  - `src/pages/doctor/DoctorSchedule.tsx`
  - `src/pages/staff/StaffDoctors.tsx`
  - `src/lib/calendar-i18n.ts`
- `DoctorCalendar.tsx` also imports `TimeGrid` from `react-big-calendar/lib/TimeGrid`.
- Most visual customization for react-big-calendar lives in `src/index.css` under the scheduler/calendar CSS variable layer.

## Theme Implementation Readiness

### Already in Place

- `next-themes` is installed and active through `src/components/ThemeProvider.tsx`.
- Light/dark theme class switching is wired with `attribute="class"` and `storageKey="pronto-theme"`.
- Tailwind is already mapped to CSS variables for core app tokens.
- A homepage-specific token namespace exists and is consumed by many public components.
- A calendar-specific token namespace exists for complex scheduler styling.
- Clinic branding fetches already exist for name/logo in authenticated and public surfaces.
- Clinic settings UI already has a branding section for logo and basic clinic profile.

### Missing or Risky for Multi-Theme

- No root `ClinicThemeProvider` or shared branding context.
- No single source of truth for clinic branding/theme data; `clinics/current` and `homepage-preview` are fetched separately in several places.
- Clinic API data currently used by frontend does not include theme fields such as primary color, accent color, typography, radius, landing palette, or dark-mode overrides.
- No runtime function currently maps clinic data into `document.documentElement.style.setProperty(...)`.
- Hardcoded hex colors remain in auth, landing, fallback SVG marks, skeletons, buttons, and some doctor detail labels.
- Several inline font-family declarations bypass Tailwind font tokens.
- Homepage tokens, app tokens, and calendar tokens are separate systems; there is no formal theme schema connecting them.
- The auth screens are not fully tokenized and should be prioritized before offering clinic-level themes.

### Practical Next Step

Introduce a typed clinic theme model and a root-level provider that fetches the current clinic once, derives CSS variables with safe fallbacks, and applies them before rendering major surfaces. Then migrate hardcoded auth/landing colors into existing app/homepage tokens so clinic-specific themes can affect the whole frontend consistently.
