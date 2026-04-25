import type { Translations } from "@/i18n/config";

export function getRoleLabel(role: string | undefined, t: Translations) {
  switch (role) {
    case "owner":
      return t.owner;
    case "admin":
      return t.admin;
    case "staff":
      return t.staff;
    case "doctor":
      return t.doctor;
    case "patient":
      return t.patient;
    default:
      return role ?? "";
  }
}
