import type { Translations } from "@/i18n/config";

export function normalizeAppointmentStatus(status?: string) {
  const normalized = (status ?? "").toLowerCase();
  return normalized === "canceled" ? "cancelled" : normalized;
}

export function getAppointmentStatusLabel(status: string | undefined, t: Translations) {
  switch (normalizeAppointmentStatus(status)) {
    case "pending":
      return t.pending;
    case "confirmed":
      return t.confirmed;
    case "completed":
      return t.completed;
    case "cancelled":
      return t.cancelled;
    default:
      return status ?? "";
  }
}
