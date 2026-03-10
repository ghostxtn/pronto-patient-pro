
-- Add a foreign key from appointments.patient_id to profiles.user_id so we can join
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_patient_profile_fkey
FOREIGN KEY (patient_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
