import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import AuthScreen from "@/components/auth/AuthScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/services/api";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validationError = useMemo(() => {
    if (!password && !confirmPassword) {
      return null;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Sifre en az ${MIN_PASSWORD_LENGTH} karakter olmalidir.`;
    }

    if (password !== confirmPassword) {
      return "Sifreler eslesmiyor.";
    }

    return null;
  }, [confirmPassword, password]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token) {
      setError("Bu sifre sifirlama baglantisi gecersiz.");
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.auth.resetPassword(token, password);
      setSuccess(true);
      window.setTimeout(() => {
        navigate("/auth", { replace: true });
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sifre sifirlanamadi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <div className="text-center mb-8">
        <h1
          className="text-2xl font-medium tracking-tight text-[#1a2e3b]"
          style={{ fontFamily: "Manrope, sans-serif" }}
        >
          Yeni sifre belirleyin
        </h1>
        <p className="mt-1 text-sm font-light text-[#5a7a8a]">
          Guvenli bir sifre secin ve hesabiniza yeniden giris yapin.
        </p>
      </div>

      {success ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#d7eadf] bg-[#f6fbf8] px-4 py-4 text-sm text-[#335b4a]">
            Sifreniz basariyla guncellendi. Giris sayfasina yonlendiriliyorsunuz.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[11px] font-medium uppercase tracking-widest text-[#5a7a8a]">
              Yeni sifre
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c96a4]" />
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 rounded-xl border-[#b5d1cc] pl-10 focus:border-[#4f8fe6] focus:ring-2 focus:ring-[#4f8fe6]/10"
                required
                minLength={MIN_PASSWORD_LENGTH}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-[11px] font-medium uppercase tracking-widest text-[#5a7a8a]">
              Yeni sifre tekrar
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c96a4]" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="********"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="h-11 rounded-xl border-[#b5d1cc] pl-10 focus:border-[#4f8fe6] focus:ring-2 focus:ring-[#4f8fe6]/10"
                required
                minLength={MIN_PASSWORD_LENGTH}
              />
            </div>
          </div>

          {!token ? (
            <p className="rounded-xl border border-[#f3d0d0] bg-[#fff6f6] px-4 py-3 text-sm text-[#a24b4b]">
              Bu sifre sifirlama baglantisi eksik veya gecersiz.
            </p>
          ) : null}

          {error ? (
            <p className="rounded-xl border border-[#f3d0d0] bg-[#fff6f6] px-4 py-3 text-sm text-[#a24b4b]">
              {error}
            </p>
          ) : null}

          {!error && validationError ? (
            <p className="rounded-xl border border-[#f5e6c7] bg-[#fffaf0] px-4 py-3 text-sm text-[#8a6732]">
              {validationError}
            </p>
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full rounded-full bg-[#4f8fe6] font-medium text-white shadow-[0_4px_14px_rgba(79,143,230,0.3)] hover:bg-[#2f75ca]"
            disabled={loading || !token}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sifreyi guncelle
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-[#5a7a8a]">
        <Link to="/auth" className="font-medium text-[#005cae] hover:underline">
          Giris sayfasina don
        </Link>
      </p>
    </AuthScreen>
  );
}
