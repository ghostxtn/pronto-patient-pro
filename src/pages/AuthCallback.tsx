import { useEffect } from "react";
import { getDefaultRouteByRole } from "@/lib/auth-routing";
import api, { clearAccessToken, setAccessToken } from "@/services/api";

function normalizeRole(input: unknown) {
  return typeof input === "string" ? input : "patient";
}

export default function AuthCallback() {
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const { accessToken } = await api.auth.refresh();
        if (!isMounted) {
          return;
        }

        setAccessToken(accessToken);
        const me = await api.profiles.me();
        if (!isMounted) {
          return;
        }

        const role = normalizeRole(me?.user?.role ?? me?.role);
        window.location.replace(getDefaultRouteByRole(role));
      } catch {
        clearAccessToken();
        if (isMounted) {
          window.location.replace("/auth?error=oauth_callback_failed");
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Signing you in...
    </div>
  );
}
