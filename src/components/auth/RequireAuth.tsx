import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.debug("[auth][guard] RequireAuth", {
    path: location.pathname,
    loading,
    hasUser: Boolean(user),
    role: user?.role,
  });

  if (loading) {
    return null;
  }

  if (!user) {
    console.debug("[auth][guard] RequireAuth redirecting to /auth", {
      path: location.pathname,
    });
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
