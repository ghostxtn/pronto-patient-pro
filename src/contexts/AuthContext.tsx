import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import api, {
  ApiError,
  type AuthOtpChallengeResponse,
  type AuthSuccessResponse,
  clearTokens,
  getAccessToken,
  setTokens,
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
  setTokens(result.accessToken ?? null, result.refreshToken ?? null);
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
      const token = getAccessToken();
      console.debug("[auth][context] bootstrap start", {
        hasAccessToken: Boolean(token),
      });

      if (!token) {
        console.debug("[auth][context] bootstrap skipped, no access token");
        setLoading(false);
        return;
      }

      try {
        const me = await api.auth.me();
        const normalizedUser = normalizeUser(me.user ?? me);
        console.debug("[auth][context] bootstrap /auth/me success", {
          userId: normalizedUser.id,
          role: normalizedUser.role,
        });
        setUser(normalizedUser);
      } catch (err) {
        console.debug("[auth][context] bootstrap failed", err);
        if (err instanceof ApiError && err.status === 401) {
          console.debug("[auth][context] bootstrap received 401, clearing tokens");
          clearTokens();
        }
        setError(err instanceof Error ? err.message : "Authentication failed");
      } finally {
        console.debug("[auth][context] bootstrap complete");
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
        console.debug("[auth][context] login start", { email });
        try {
          const result = await api.auth.login(email, pass);
          if (isOtpChallenge(result)) {
            console.debug("[auth][context] login otp challenge issued", { email });
            return result;
          }

          const normalizedUser = applyAuthSuccess(result, setUser);
          console.debug("[auth][context] login success", {
            userId: normalizedUser.id,
            role: normalizedUser.role,
          });
        } catch (err) {
          console.debug("[auth][context] login failed", err);
          setError(err instanceof Error ? err.message : "Login failed");
          throw err;
        } finally {
          setLoading(false);
        }
      },
      register: async (data: { email: string; password: string; firstName: string; lastName: string }) => {
        setLoading(true);
        setError(null);
        console.debug("[auth][context] register start", { email: data.email });
        try {
          const result = await api.auth.register(data);
          if (isOtpChallenge(result)) {
            console.debug("[auth][context] register otp challenge issued", { email: data.email });
            return result;
          }

          const normalizedUser = applyAuthSuccess(result, setUser);
          console.debug("[auth][context] register success", {
            userId: normalizedUser.id,
            role: normalizedUser.role,
          });
        } catch (err) {
          console.debug("[auth][context] register failed", err);
          setError(err instanceof Error ? err.message : "Registration failed");
          throw err;
        } finally {
          setLoading(false);
        }
      },
      googleLogin: async (idToken: string) => {
        setLoading(true);
        setError(null);
        console.debug("[auth][context] googleLogin start");
        try {
          const result = await api.auth.googleLogin(idToken);
          setTokens(result.accessToken ?? null, result.refreshToken ?? null);
          const normalizedUser = normalizeUser(result.user);
          console.debug("[auth][context] googleLogin success", {
            userId: normalizedUser.id,
            role: normalizedUser.role,
          });
          setUser(normalizedUser);
        } catch (err) {
          console.debug("[auth][context] googleLogin failed", err);
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
          const normalizedUser = applyAuthSuccess(result, setUser);
          console.debug("[auth][context] otp verification success", {
            userId: normalizedUser.id,
            role: normalizedUser.role,
          });
        } catch (err) {
          console.debug("[auth][context] otp verification failed", err);
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
          console.debug("[auth][context] resend otp failed", err);
          setError(err instanceof Error ? err.message : "Resend OTP failed");
          throw err;
        } finally {
          setLoading(false);
        }
      },
      logout: async () => {
        setLoading(true);
        setError(null);
        console.debug("[auth][context] logout start");
        try {
          await api.auth.logout();
        } finally {
          console.debug("[auth][context] logout clearing local session");
          clearTokens();
          setUser(null);
          setLoading(false);
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
