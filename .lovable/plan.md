

# Doctor Appointment Website - Implementation Plan

This is a full-featured appointment booking platform for a private clinic with three user roles (Patient, Doctor, Admin), social authentication, and a polished modern design.

---

## Architecture Overview

**Backend**: Supabase (Lovable Cloud) for auth, database, storage, and edge functions.

**Auth**: Supabase Auth with Google, Microsoft, and Facebook OAuth providers. Role-based access using a `user_roles` table.

**Storage**: Supabase Storage for patient-uploaded images/files attached to appointments.

---

## Database Schema

- **profiles** - user id, full name, email, phone, avatar, created_at
- **user_roles** - user_id, role (enum: patient, doctor, admin)
- **specializations** - id, name (e.g. Cardiology, Dermatology, etc.)
- **doctors** - id, user_id, specialization_id, bio, experience_years, consultation_fee
- **doctor_availability** - id, doctor_id, day_of_week, start_time, end_time, is_active
- **appointments** - id, patient_id, doctor_id, date, start_time, end_time, status (pending/confirmed/cancelled/completed), notes
- **appointment_attachments** - id, appointment_id, file_url, file_type, uploaded_by
- **appointment_notes** - id, appointment_id, content, created_by, created_at

RLS policies ensure patients see only their data, doctors see their patients, and admins see everything.

---

## Pages & Features

### Public
- **Landing Page** - Hero with clinic branding, specializations grid, how-it-works steps, testimonials
- **Sign In / Sign Up** - Social login buttons (Google, Microsoft, Facebook) + email/password option

### Patient Portal
- **Dashboard** - Upcoming appointments, quick book button, recent activity
- **Find Doctors** - Filter by specialization, view availability calendar
- **Book Appointment** - Select date/time slot, add notes & upload files
- **My Appointments** - List with status badges, cancel/reschedule options
- **Appointment Detail** - Notes, attachments, doctor info

### Doctor Portal
- **Dashboard** - Today's schedule, upcoming appointments, patient count stats
- **My Schedule** - Manage weekly availability slots
- **Appointments** - View/confirm/complete appointments, add clinical notes
- **Patient Files** - View attached documents and images

### Admin Panel
- **Dashboard** - Overview stats (total appointments, doctors, patients)
- **Manage Doctors** - Add/edit/remove doctors, assign specializations
- **Manage Patients** - View patient list, appointment history
- **All Appointments** - Full appointment management
- **Settings** - Clinic info, working hours

---

## Design Direction

- Clean medical aesthetic with a calming color palette (soft blues, whites, subtle greens)
- Glass-morphism cards, smooth animations, gradient accents
- Responsive layout for mobile and desktop
- Status indicators with color-coded badges
- Calendar-style availability view with interactive time slot selection

---

## Implementation Order

1. Set up Supabase Cloud, database schema, and RLS policies
2. Auth system with social providers and role-based routing
3. Landing page with polished design
4. Patient flow: find doctors, check availability, book appointments
5. Doctor flow: manage schedule, view/manage appointments
6. Admin panel: manage doctors, patients, appointments
7. File upload for appointment attachments
8. Notifications and polish

---

## Prerequisites

Supabase Cloud needs to be enabled. Social OAuth providers (Google, Microsoft, Facebook) will need to be configured in the Supabase dashboard by you - I will provide step-by-step instructions when we get there.

