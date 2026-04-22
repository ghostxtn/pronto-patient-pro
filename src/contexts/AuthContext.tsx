import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import api, {
  ApiError,
  type AuthOtpChallengeResponse,
  type AuthSuccessResponse,
  clearAccessToken,
  setAccessToken,
} from "@/services/api";
import type { AppRole } from "@/lib/auth-routing";

export interface User {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  clinic_id: string | null;
  avatar_url: string | null;
  default_appointment_duration?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<AuthOtpChallengeResponse | void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<AuthOtpChallengeResponse | void>;
  googleLogin: (idToken: string) => Promise<void>;
  verifyOtp: (flowToken: string, code: string) => Promise<void>;
  resendOtp: (flowToken: string) => Promise<AuthOtpChallengeResponse>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(raw: any): User {
  const validRoles: AppRole[] = ["owner", "admin", "staff", "doctor", "patient"];
  const role = validRoles.includes(raw.role) ? raw.role : "patient";

  return {
    id: raw.id,
    email: raw.email,
    name:
      raw.name ||
      raw.full_name ||
      [raw.firstName, raw.lastName].filter(Boolean).join(" ") ||
      [raw.first_name, raw.last_name].filter(Boolean).join(" "),
    role,
    clinic_id: raw.clinic_id ?? raw.clinicId ?? null,
    avatar_url: raw.avatar_url ?? raw.avatarUrl ?? null,
    default_appointment_duration:
      raw.default_appointment_duration ?? raw.defaultAppointmentDuration ?? 30,
  };
}

function isOtpChallenge(result: unknown): result is AuthOtpChallengeResponse {
  return Boolean(
    result &&
      typeof result === "object" &&
      "requiresOtp" in result &&
      (result as { requiresOtp?: unknown }).requiresOtp === true &&
      "flowToken" in result,
  );
}

function applyAuthSuccess(result: AuthSuccessResponse, setUser: (user: User) => void) {
  setAccessToken(result.accessToken ?? null);
  const normalizedUser = normalizeUser(result.user);
  setUser(normalizedUser);
  return normalizedUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { accessToken } = await api.auth.refresh();
        setAccessToken(accessToken);
        const me = await api.auth.me();
        const normalizedUser = normalizeUser(me.user ?? me);
        setUser(normalizedUser);
      } catch (err) {
        clearAccessToken();
        setUser(null);
        if (!(err instanceof ApiError && err.status === 401)) {
          console.error("Auth bootstrap failed");
          setError(err instanceof Error ? err.message : "Authentication failed");
        }
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      error,
      login: async (email: string, pass: string) => {
        setLoading(true);
        setError(null);
        try {
          const result = await api.auth.login(email, pass);
          if (isOtpChallenge(result)) {
            return result;
          }

          setAccessToken(result.accessToken ?? null);
          const me = await api.auth.me();
          setUser(normalizeUser(me.user ?? me));
        } catch (err) {
          console.error("Login failed");
          setError(err instanceof Error ? err.message : "Login failed");
          throw err;
        } finally {
          setLoading(false);
        }
      },
      register: async (data: { email: string; password: string; firstName: string; lastName: string }) => {
        setLoading(true);
        setError(null);
        try {
          const result = await api.auth.register(data);
          if (isOtpChallenge(result)) {
            return result;
          }

          applyAuthSuccess(result, setUser);
        } catch (err) {
          console.error("Registration failed");
          setError(err instanceof Error ? err.message : "Registration failed");
          throw err;
        } finally {
          setLoading(false);
        }
      },
      googleLogin: async (idToken: string) => {
        setLoading(true);
        setError(null);
        try {
          const result = await api.auth.googleLogin(idToken);
          setAccessToken(result.accessToken ?? null);
          setUser(normalizeUser(result.user));
        } catch (err) {
          console.error("Google login failed");
          setError(err instanceof Error ? err.message : "Google login failed");
          throw err;
        } finally {
          setLoading(false);
        }
      },
      verifyOtp: async (flowToken: string, code: string) => {
        setLoading(true);
        setError(null);
        try {
          const result = await api.auth.verifyOtp(flowToken, code);
          setAccessToken(result.accessToken ?? null);
          const me = await api.auth.me();
          setUser(normalizeUser(me.user ?? me));
        } catch (err) {
          console.error("OTP verification failed");
          setError(err instanceof Error ? err.message : "OTP verification failed");
          throw err;
        } finally {
          setLoading(false);
        }
      },
      resendOtp: async (flowToken: string) => {
        setLoading(true);
        setError(null);
        try {
          return await api.auth.resendOtp(flowToken);
        } catch (err) {
          console.error("Resend OTP failed");
          setError(err instanceof Error ? err.message : "Resend OTP failed");
          throw err;
        } finally {
          setLoading(false);
        }
      },
      logout: async () => {
        setLoading(true);
        setError(null);
        try {
          await api.auth.logout();
        } finally {
          clearAccessToken();
          setUser(null);
          setLoading(false);
          if (typeof window !== "undefined") {
            window.location.href = "/auth";
          }
        }
      },
      clearError: () => setError(null),
    }),
    [error, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
