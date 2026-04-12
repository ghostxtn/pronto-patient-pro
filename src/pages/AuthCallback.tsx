import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { setTokens } from "@/services/api";
import { getDefaultRouteByRole } from "@/lib/auth-routing";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const requiresOtp = searchParams.get("requiresOtp") === "true";
    const flowToken = searchParams.get("flowToken");
    const email = searchParams.get("email");
    const oauthCode = searchParams.get("code");
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");
    const role = searchParams.get("role") || "patient";

    console.debug("[auth][callback] received callback params", {
      hasAccessToken: Boolean(accessToken),
      hasRefreshToken: Boolean(refreshToken),
      role,
    });

    if (requiresOtp && flowToken) {
      const nextUrl = new URL("/auth", window.location.origin);
      nextUrl.searchParams.set("mode", "otp");
      nextUrl.searchParams.set("flowToken", flowToken);
      if (email) {
        nextUrl.searchParams.set("email", email);
      }
      window.location.replace(nextUrl.toString());
      return;
    }

    if (oauthCode) {
      fetch(`${import.meta.env.VITE_API_URL || "/api"}/auth/exchange-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: oauthCode }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.accessToken && data.refreshToken) {
            setTokens(data.accessToken, data.refreshToken);
            window.location.replace(getDefaultRouteByRole(data.role || "patient"));
          } else {
            window.location.replace("/auth");
          }
        })
        .catch(() => {
          window.location.replace("/auth");
        });
      return;
    }

    if (!accessToken) {
      console.debug("[auth][callback] missing access token, redirecting to /auth");
      window.location.replace("/auth");
      return;
    }

    setTokens(accessToken, refreshToken);

    // Force full reload so AuthProvider bootstraps again and loads user from /auth/me
    console.debug("[auth][callback] redirecting to role default route", {
      target: getDefaultRouteByRole(role),
    });
    window.location.replace(getDefaultRouteByRole(role));
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Signing you in...
    </div>
  );
}
// test
