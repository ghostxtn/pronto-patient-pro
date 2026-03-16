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

  if (loading || isDoctorProfileLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role === "doctor" || hasActiveDoctorProfile(doctorProfile)) {
    return <Outlet />;
  }

  return <Navigate to={getDefaultRouteByRole(user.role)} replace />;
}
