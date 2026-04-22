export const APPOINTMENT_CONFIRMED_STATUSES = ['approved', 'confirmed'] as const;
export const APPOINTMENT_DECLINED_STATUSES = ['declined', 'rejected'] as const;
export const APPOINTMENT_NON_BLOCKING_STATUSES = [
  'cancelled',
  'declined',
  'rejected',
] as const;
export const APPOINTMENT_REMINDER_ELIGIBLE_STATUSES = [
  'approved',
  'confirmed',
  'scheduled',
] as const;

export function normalizeAppointmentStatus(status?: string | null) {
  const normalized = (status ?? '').trim().toLowerCase();
  return normalized === 'canceled' ? 'cancelled' : normalized;
}

export function isConfirmedAppointmentStatus(status?: string | null) {
  return APPOINTMENT_CONFIRMED_STATUSES.includes(
    normalizeAppointmentStatus(status) as (typeof APPOINTMENT_CONFIRMED_STATUSES)[number],
  );
}

export function isDeclinedAppointmentStatus(status?: string | null) {
  return APPOINTMENT_DECLINED_STATUSES.includes(
    normalizeAppointmentStatus(status) as (typeof APPOINTMENT_DECLINED_STATUSES)[number],
  );
}

export function isReminderEligibleAppointmentStatus(status?: string | null) {
  return APPOINTMENT_REMINDER_ELIGIBLE_STATUSES.includes(
    normalizeAppointmentStatus(status) as (typeof APPOINTMENT_REMINDER_ELIGIBLE_STATUSES)[number],
  );
}

export function isBlockingAppointmentStatus(status?: string | null) {
  return !APPOINTMENT_NON_BLOCKING_STATUSES.includes(
    normalizeAppointmentStatus(status) as (typeof APPOINTMENT_NON_BLOCKING_STATUSES)[number],
  );
}
