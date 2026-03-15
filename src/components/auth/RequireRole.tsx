import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getDefaultRouteByRole } from "@/lib/auth-routing";

interface RequireRoleProps {
  allowedRoles: string[];
}

export default function RequireRole({ allowedRoles }: RequireRoleProps) {
  const { user, loading } = useAuth();

  console.debug("[auth][guard] RequireRole", {
    loading,
    hasUser: Boolean(user),
    role: user?.role,
    allowedRoles,
  });

  if (loading) {
    return null;
  }

  if (!user) {
    console.debug("[auth][guard] RequireRole redirecting to /auth");
    return <Navigate to="/auth" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    console.debug("[auth][guard] RequireRole redirecting by role", {
      role: user.role,
      redirectTo: getDefaultRouteByRole(user.role),
    });
    return <Navigate to={getDefaultRouteByRole(user.role)} replace />;
  }

  return <Outlet />;
}
