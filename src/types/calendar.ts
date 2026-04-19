export interface AvailabilitySlot {
  id: string;
  doctor_id: string;
  day_of_week: number | null;
  specific_date?: string | null;
  start_time: string;
  end_time: string;
  slot_duration: number;
  is_active: boolean;
}

export interface AvailabilityOverride {
  id: string;
  doctor_id: string;
  date: string;
  type: "blackout" | "custom_hours";
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  type: string;
  notes?: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
}

export interface ClinicalNote {
  id: string;
  patient_id: string;
  doctor_id: string;
  appointment_id: string | null;
  diagnosis: string | null;
  treatment: string | null;
  prescription: string | null;
  notes: string | null;
  created_at: string;
  doctor: {
    firstName: string;
    lastName: string;
    title: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type: "availability" | "appointment" | "blackout" | "custom_hours";
  resource?: Appointment | AvailabilitySlot | AvailabilityOverride;
}
