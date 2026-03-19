export function hasActiveDoctorProfile(profile: any) {
  if (!profile || typeof profile !== "object") {
    return false;
  }

  if ("is_active" in profile) {
    return profile.is_active === true;
  }

  if ("isActive" in profile) {
    return profile.isActive === true;
  }

  if ("status" in profile) {
    return profile.status === "active";
  }

  return false;
}
