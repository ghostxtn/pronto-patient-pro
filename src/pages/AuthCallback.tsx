import { useEffect } from "react";
import { getDefaultRouteByRole } from "@/lib/auth-routing";
import api, { clearAccessToken, setAccessToken } from "@/services/api";

const OTP_FLOW_TOKEN_KEY = "otp_flow_token";
const OTP_FLOW_EMAIL_KEY = "otp_flow_email";

function normalizeRole(input: unknown) {
  return typeof input === "string" ? input : "patient";
}

export default function AuthCallback() {
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const params = new URLSearchParams(window.location.search);
      const requiresOtp = params.get("requiresOtp") === "true";
      const flowToken = params.get("flowToken");
      const email = params.get("email");

      if (requiresOtp && flowToken && email) {
        sessionStorage.setItem(OTP_FLOW_TOKEN_KEY, flowToken);
        sessionStorage.setItem(OTP_FLOW_EMAIL_KEY, email);
        window.location.replace("/auth");
        return;
      }

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
