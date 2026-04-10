import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Lock, Mail, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDefaultRouteByRole } from "@/lib/auth-routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { toast } from "sonner";

type PendingOtpState = {
  flowToken: string;
  email: string;
  source: "login" | "signup" | "google";
};

function readOtpState(searchParams: URLSearchParams): PendingOtpState | null {
  const mode = searchParams.get("mode");
  const flowToken = searchParams.get("flowToken");
  const email = searchParams.get("email");

  if (mode !== "otp" || !flowToken || !email) {
    return null;
  }

  return {
    flowToken,
    email,
    source: "google",
  };
}

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("tab") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingOtp, setPendingOtp] = useState<PendingOtpState | null>(() => readOtpState(searchParams));
  const navigate = useNavigate();
  const { user, login, register, googleLogin, verifyOtp, resendOtp } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (user) navigate(getDefaultRouteByRole(user.role), { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    setPendingOtp(readOtpState(searchParams));
  }, [searchParams]);

  const otpDescription = useMemo(() => {
    if (!pendingOtp) {
      return "";
    }

    if (pendingOtp.source === "signup") {
      return t.otpSignupDesc;
    }

    return t.otpLoginDesc;
  }, [pendingOtp, t]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = isSignUp
        ? await register({ email, password, firstName, lastName })
        : await login(email, password);

      if (result?.requiresOtp) {
        setOtpCode("");
        setPendingOtp({
          flowToken: result.flowToken,
          email: result.email,
          source: isSignUp ? "signup" : "login",
        });
        setSearchParams({
          mode: "otp",
          flowToken: result.flowToken,
          email: result.email,
        });
        toast.success(t.otpCodeSent);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pendingOtp) {
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(pendingOtp.flowToken, otpCode);
      setSearchParams({});
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingOtp) {
      return;
    }

    setLoading(true);
    try {
      const result = await resendOtp(pendingOtp.flowToken);
      setPendingOtp({
        ...pendingOtp,
        flowToken: result.flowToken,
        email: result.email,
      });
      setSearchParams({
        mode: "otp",
        flowToken: result.flowToken,
        email: result.email,
      });
      setOtpCode("");
      toast.success(t.otpCodeResent);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOtp = () => {
    setPendingOtp(null);
    setOtpCode("");
    setSearchParams(isSignUp ? { tab: "signup" } : {});
  };

  const handleGoogleLogin = async () => {
    void googleLogin;
    window.location.href = `${import.meta.env.VITE_API_URL || "/api"}/auth/google`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen flex"
    >
      <div
        className="relative hidden lg:flex lg:w-1/2 items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #c8e6f5 0%, #b5d1cc 40%, #9ecfbd 100%)",
        }}
      >
        <div className="absolute left-[-5rem] top-[-4rem] h-64 w-64 rounded-full bg-[#4f8fe6] opacity-20 blur-[80px]" />
        <div className="absolute bottom-[-5rem] right-[-4rem] h-72 w-72 rounded-full bg-[#236a53] opacity-15 blur-[90px]" />
        <div className="relative z-10 w-full max-w-xl px-10">
          <div className="rounded-3xl border border-white/40 bg-white/20 p-10 backdrop-blur-xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/50 bg-white/30 px-4 py-1.5">
              <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" className="h-9 w-9">
                <rect x="0" y="13" width="44" height="18" rx="9" fill="#65a98f" />
                <rect x="13" y="0" width="18" height="22" rx="9" fill="#4f8fe6" />
                <rect x="13" y="22" width="18" height="22" rx="9" fill="#4f8fe6" />
              </svg>
              <span className="font-medium tracking-tight text-[#081e2a]" style={{ fontFamily: "Manrope, sans-serif" }}>
                Pronto Klinik
              </span>
            </div>

            <div className="mt-8 space-y-3">
              <h2
                className="text-2xl font-light tracking-tight text-[#081e2a]"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                {t.heroTitle1} <strong className="font-semibold text-[#005cae]">{t.heroTitle2.toLowerCase()}</strong>
              </h2>
              <p className="text-sm text-[#3a5a6a]">
                {t.authHeroDesc}
              </p>
            </div>

            <div className="mt-6 flex gap-2">
              {[
                ["2.4k+", t.authHeroPatients],
                ["98%", t.authHeroSatisfaction],
                ["7/24", t.authHeroSupport],
              ].map(([value, label]) => (
                <div
                  key={label}
                  className="flex-1 rounded-2xl border border-white/35 bg-white/25 p-3 text-center"
                >
                  <div
                    className="text-lg font-semibold text-[#081e2a]"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {value}
                  </div>
                  <div className="text-[11px] text-[#3a5a6a]">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#f4f8fd] p-4 md:p-8 lg:p-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-4 flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#5a7a8a] hover:text-[#1a2e3b]">
              <ArrowLeft className="h-4 w-4" />
              {t.backToHome}
            </Link>
            <LanguageSwitcher />
          </div>

          <div className="w-full rounded-2xl bg-white p-6 shadow-[0_20px_40px_rgba(8,30,42,0.07)] md:p-10">
            <div className="mb-8 flex items-center gap-3">
              <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" className="h-11 w-11">
                <rect x="0" y="13" width="44" height="18" rx="9" fill="#65a98f" />
                <rect x="13" y="0" width="18" height="22" rx="9" fill="#4f8fe6" />
                <rect x="13" y="22" width="18" height="22" rx="9" fill="#4f8fe6" />
              </svg>
              <span
                className="text-[15px] font-light tracking-tight text-[#081e2a]"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                Pronto Klinik
              </span>
            </div>

            {!pendingOtp ? (
              <>
                <div className="text-center mb-8">
                  <h1
                    className="text-2xl font-medium tracking-tight text-[#1a2e3b]"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {isSignUp ? t.createAccountTitle : t.welcomeBack}
                  </h1>
                  <p className="mt-1 text-sm font-light text-[#5a7a8a]">
                    {isSignUp ? t.enterYourDetails : t.signInToAccount}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <Button
                    variant="outline"
                    className="flex h-auto w-full items-center justify-center gap-2.5 rounded-xl border border-[#dce5ec] bg-white py-3 text-sm font-medium text-[#1a2e3b] hover:bg-[#eaf5ff]"
                    onClick={handleGoogleLogin}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.05 11.05 0 001 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {t.continueWithGoogle}
                  </Button>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#f0f4f8]" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-[#5a7a8a]">{t.orContinueWithEmail}</span>
                  </div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {isSignUp && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-[11px] font-medium uppercase tracking-widest text-[#5a7a8a]">
                          {t.firstName}
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c96a4]" />
                          <Input
                            id="firstName"
                            placeholder="John"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="h-11 rounded-xl border-[#b5d1cc] pl-10 focus:border-[#4f8fe6] focus:ring-2 focus:ring-[#4f8fe6]/10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-[11px] font-medium uppercase tracking-widest text-[#5a7a8a]">
                          {t.lastName}
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c96a4]" />
                          <Input
                            id="lastName"
                            placeholder="Smith"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="h-11 rounded-xl border-[#b5d1cc] pl-10 focus:border-[#4f8fe6] focus:ring-2 focus:ring-[#4f8fe6]/10"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[11px] font-medium uppercase tracking-widest text-[#5a7a8a]">
                      {t.email}
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c96a4]" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 rounded-xl border-[#b5d1cc] pl-10 focus:border-[#4f8fe6] focus:ring-2 focus:ring-[#4f8fe6]/10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[11px] font-medium uppercase tracking-widest text-[#5a7a8a]">
                      {t.password}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c96a4]" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 rounded-xl border-[#b5d1cc] pl-10 focus:border-[#4f8fe6] focus:ring-2 focus:ring-[#4f8fe6]/10"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  {!isSignUp ? (
                    <div className="flex justify-end">
                      <Link to="/forgot-password" className="text-sm font-medium text-[#005cae] hover:underline">
                        {t.forgotPassword}
                      </Link>
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-full bg-[#4f8fe6] font-medium text-white shadow-[0_4px_14px_rgba(79,143,230,0.3)] hover:bg-[#2f75ca]"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSignUp ? t.createAccountTitle : t.signIn}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-[#5a7a8a]">
                  {isSignUp ? t.alreadyHaveAccount : t.dontHaveAccount}{" "}
                  <button
                    className="font-medium text-[#005cae] hover:underline"
                    onClick={() => {
                      const nextSignUp = !isSignUp;
                      setIsSignUp(nextSignUp);
                      setSearchParams(nextSignUp ? { tab: "signup" } : {});
                    }}
                  >
                    {isSignUp ? t.signIn : t.signUp}
                  </button>
                </p>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1
                    className="text-2xl font-medium tracking-tight text-[#1a2e3b]"
                    style={{ fontFamily: "Manrope, sans-serif" }}
                  >
                    {t.emailVerification}
                  </h1>
                  <p className="mt-2 text-sm font-light text-[#5a7a8a]">{otpDescription}</p>
                  <p className="mt-3 text-sm font-medium text-[#1a2e3b]">{pendingOtp.email}</p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-[11px] font-medium uppercase tracking-widest text-[#5a7a8a]">
                      {t.otpCodeLabel}
                    </Label>
                    <InputOTP
                      id="otp"
                      maxLength={6}
                      value={otpCode}
                      onChange={setOtpCode}
                      containerClassName="justify-center"
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }, (_, index) => (
                          <InputOTPSlot
                            key={index}
                            index={index}
                            className="h-12 w-12 rounded-xl border border-[#b5d1cc] text-base first:rounded-xl first:border last:rounded-xl"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-full bg-[#4f8fe6] font-medium text-white shadow-[0_4px_14px_rgba(79,143,230,0.3)] hover:bg-[#2f75ca]"
                    disabled={loading || otpCode.length !== 6}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t.verifyCode}
                  </Button>
                </form>

                <div className="mt-6 flex flex-col gap-3 text-sm">
                  <button
                    type="button"
                    className="font-medium text-[#005cae] hover:underline"
                    onClick={handleResendOtp}
                    disabled={loading}
                  >
                    {t.resendCode}
                  </button>
                  <button
                    type="button"
                    className="text-[#5a7a8a] hover:text-[#1a2e3b]"
                    onClick={handleCancelOtp}
                    disabled={loading}
                  >
                    {t.goBack}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
