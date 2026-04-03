import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { hasActiveDoctorProfile } from "@/lib/doctor-access";
import { getDefaultRouteByRole } from "@/lib/auth-routing";
import api from "@/services/api";

export default function RequireDoctorAccess() {
  const { user, loading } = useAuth();
  const shouldCheckDoctorProfile = !!user && user.role !== "doctor";

  const { data: doctorProfile, isLoading: isDoctorProfileLoading } = useQuery({
    queryKey: ["doctor-access-profile", user?.id],
    queryFn: () => api.doctors.me(),
    enabled: shouldCheckDoctorProfile,
    retry: false,
  });

  console.debug("[auth][guard] RequireDoctorAccess", {
    loading,
    isDoctorProfileLoading,
    hasUser: Boolean(user),
    userId: user?.id,
    role: user?.role,
    shouldCheckDoctorProfile,
    hasDoctorProfile: Boolean(doctorProfile),
    doctorProfileIsActive: hasActiveDoctorProfile(doctorProfile),
  });

  if (loading || isDoctorProfileLoading) {
    return null;
  }

  if (!user) {
    console.debug("[auth][guard] RequireDoctorAccess redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }

  if (user.role === "doctor" || hasActiveDoctorProfile(doctorProfile)) {
    console.debug("[auth][guard] RequireDoctorAccess allowing route", {
      role: user.role,
      userId: user.id,
    });
    return <Outlet />;
  }

  console.debug("[auth][guard] RequireDoctorAccess redirecting by role", {
    role: user.role,
    redirectTo: getDefaultRouteByRole(user.role),
  });
  return <Navigate to={getDefaultRouteByRole(user.role)} replace />;
}
