export type AppRole = "owner" | "admin" | "staff" | "doctor" | "patient";

export function getDefaultRouteByRole(role?: string) {
  switch (role) {
    case "owner":
      return "/owner/dashboard";
    case "admin":
      return "/admin/dashboard";
    case "staff":
      return "/staff/dashboard";
    case "doctor":
      return "/doctor/dashboard";
    case "patient":
    default:
      return "/dashboard";
  }
}