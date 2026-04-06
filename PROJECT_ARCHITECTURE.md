# Project Architecture: Pronto Patient Pro (MediBook)

## Project Purpose and Summary
Pronto Patient Pro (internally referred to as MediBook) is a comprehensive clinic management system designed to streamline interactions between patients, doctors, and clinic staff. It provides a multi-tenant platform where each clinic can manage its own scheduling, patient records, and medical staff.

**Key Features:**
- **Multi-tenant Architecture:** Supports multiple clinics via domain-based routing (`X-Clinic-Domain` header).
- **Role-Based Access Control:** Distinct workflows for Patients, Doctors, Staff, Admins, and Owners.
- **Calendar & Appointment Management:** A robust scheduling system with backend-driven availability and conflict resolution.
- **Clinical Notes & Medical Records:** Secure storage and management of patient clinical history.
- **Modern Landing Page:** Highly interactive landing page with smooth scroll and parallax animations.

---

## Tech Stack

### Frontend
- **Framework:** [React 18.3](https://react.dev/) with [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) (via [shadcn/ui](https://ui.shadcn.com/))
- **Animations:** [Framer Motion](https://www.framer.com/motion/) + [Lenis](https://github.com/darkroomengineering/lenis) (Smooth Scroll)
- **Data Fetching:** [TanStack Query v5](https://tanstack.com/query/latest)
- **Routing:** [React Router Dom v6](https://reactrouter.com/)
- **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Calendar:** [React Big Calendar](https://jquense.github.io/react-big-calendar/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Backend
- **Framework:** [NestJS v11](https://nestjs.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [Drizzle ORM](https://orm.drizzle.team/)
- **Caching/Session:** [Redis](https://redis.io/) (ioredis)
- **Authentication:** [Passport.js](https://www.passportjs.org/) (JWT & Google OAuth 2.0)
- **File Storage:** Local storage (Multer) with abstraction for future cloud migration.
- **Email:** [Nodemailer](https://nodemailer.com/)

---

## Folder Structure

### Root
- `package.json`: Frontend dependencies and scripts.
- `docker-compose.yml`: Infrastructure (Postgres, Redis).
- `tailwind.config.ts` / `postcss.config.js`: Styling configuration.
- `docs/`: Architectural documentation and milestone briefs.

### Frontend (`src/`)
- `components/`:
    - `ui/`: Reusable shadcn/ui base components.
    - `calendar/`: Business logic components for the calendar (Modals, Sheets, Main View).
    - `auth/`: Guard components like `RequireAuth`, `RequireRole`.
    - `landing/`: Components specific to the interactive landing page.
- `contexts/`:
    - `AuthContext.tsx`: Global authentication state management.
    - `LanguageContext.tsx`: Internationalization (i18n) state.
- `hooks/`: Custom hooks for data fetching (e.g., `usePublicDoctors`, `useToast`).
- `i18n/`: Translation dictionaries (`en.ts`, `tr.ts`).
- `lib/`: Utility functions, constants, and role-based routing logic (`auth-routing.ts`).
- `pages/`: Page-level components organized by role (admin, doctor, public, staff).
- `services/`: `api.ts` - Centralized API client using `fetch` with interceptors for auth and multi-tenancy.
- `types/`: TypeScript interfaces and types (e.g., `calendar.ts`).
- `utils/`: Common helpers (e.g., `calendarUtils.ts`).

### Backend (`backend/src/`)
- `database/`: Drizzle schema definitions, migrations, and seeding scripts.
- `auth/`: Authentication logic (JWT, OAuth, OTP).
- `appointments/`: Appointment CRUD and scheduling logic.
- `availability/` & `availability-overrides/`: Doctor working hours and blackout management.
- `clinics/`: Multi-tenant clinic management.
- `doctors/` / `patients/` / `staff/`: Role-specific business logic.
- `storage/`: File upload and management service.
- `common/`: Global decorators, guards, filters, and interceptors.

---

## Pages and Routes

### Public Routes
- `/`: Landing page with interactive animations.
- `/auth`: Login / Signup / OTP verification.
- `/doctors`: Public doctor search/discovery.
- `/specialties`: Public specialties list.
- `/contact`: Contact form.
- `/legal/*`: KVKK, Privacy Policy, Terms of Use, etc.

### Patient Routes (Protected)
- `/patient/dashboard`: Personal overview, upcoming appointments.
- `/patient/appointments`: Appointment history and management.
- `/patient/doctors/:id`: Detailed doctor profile and booking intent.
- `/patient/profile`: Personal information management.

### Doctor Routes (Protected)
- `/doctor/dashboard`: Daily schedule and patient metrics.
- `/doctor/schedule`: Full calendar for managing availability and appointments.
- `/doctor/appointments`: List view of all assigned appointments.
- `/doctor/patients`: List of patients seen by the doctor.

### Staff/Admin/Owner Routes (Protected)
- `/admin/dashboard`: Clinic-wide metrics and management.
- `/admin/doctors`: Manage medical staff profiles and status.
- `/admin/patients`: Centralized patient database.
- `/admin/appointments`: Management of all clinic appointments.
- `/admin/settings`: Clinic configuration (branding, encryption, etc.).
- `/staff/dashboard`: Operational view for reception/secretaries.

---

## Key Components

### `AppLayout.tsx`
The primary layout wrapper for authenticated users.
- **Props:** `children: ReactNode`.
- **Functionality:** Renders a responsive navbar and sidebar. Dynamically generates navigation links based on the user's role. Handles the logout flow.
- **Usage:** Wraps all protected routes in `App.tsx`.

### `DoctorCalendar.tsx`
The core scheduling interface.
- **Functionality:** Uses `react-big-calendar` to display appointments, availability, and overrides.
- **Logic:** Strictly follows "Backend as Source of Truth". Does not calculate slots locally; instead, it renders data fetched from `/availability/slots` and `/appointments`.
- **Interactions:** Opens `AppointmentCreateSheet`, `AvailabilityModal`, or `OverrideModal` to capture user intent.

### `HeroSection.tsx` (Landing Page)
- **Functionality:** Implements a high-performance scroll animation using Lenis and Framer Motion.
- **Visuals:** Features parallax "blobs", rotating rings, and a sticky background that overlays with the rest of the page content.

---

## Services and API Calls
The frontend uses a centralized `api` object in `src/services/api.ts`.

### Authentication (`/auth`)
- `POST /auth/login`: Email/password login, returns JWT or OTP challenge.
- `POST /auth/register`: User registration.
- `POST /auth/verify-otp`: Validates 6-digit code.
- `POST /auth/google`: Handles Google ID Token verification.
- `GET /auth/me`: Validates current session and returns user profile.

### Scheduling
- `GET /availability/slots`: Fetches valid time slots for a doctor/date (Public/Private).
- `GET /appointments`: Lists appointments with filters for role and date range.
- `POST /appointments`: Creates a new appointment (intent).
- `PATCH /appointments/:id/status`: Updates appointment state (Confirmed, Cancelled, etc.).

### Multi-tenancy
Every request automatically includes the `X-Clinic-Domain` header, derived from the current hostname, allowing the backend to scope database queries to the correct clinic.

---

## State Management
- **Auth State:** Managed via `AuthContext`. Provides the `user` object and methods for auth flows. Persisted via `localStorage` (JWT).
- **UI State:** Local `useState` and `useMemo` for component-level toggles (modals, menus).
- **Server State:** Handled by **TanStack Query**. Manages caching, background refetching, and loading/error states for all API data.
- **Internationalization:** `LanguageContext` manages the current locale (`en` or `tr`) and provides the `t` translation object.

---

## Key Types & Interfaces

```typescript
// src/types/calendar.ts
export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  patient: { firstName: string; lastName: string; email?: string };
}

// src/contexts/AuthContext.tsx
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'staff' | 'doctor' | 'patient';
  clinic_id: string | null;
}
```

---

## Known Bugs or Incomplete Features
- **Calendar Stabilization (Milestone 1):** Currently in progress. Ensuring the frontend does not contain any "shadow" scheduling logic.
- **Permissions:** Refinement of the division of labor between Staff and Doctors regarding overriding availability is ongoing.
- **Partial Failures:** Surfacing backend validation errors (e.g., slot already taken) without implying frontend authority needs better UI feedback.

---

## What Needs to Be Done Next
1. **Verify Backend Authority:** Audit all calendar interactions to ensure they purely capture "intent" and wait for backend confirmation.
2. **Read-Only Integration:** Finalize the transition of `DoctorCalendar` to a pure presentation layer.
3. **Staff Workflow Polish:** Ensure staff members can effectively manage multiple doctor calendars from a single view.
4. **Error Handling:** Implement robust "live region" announcements for accessibility and clear error messaging for scheduling conflicts.
