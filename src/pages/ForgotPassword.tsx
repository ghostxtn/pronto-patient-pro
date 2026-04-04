import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import AuthScreen from "@/components/auth/AuthScreen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.auth.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sifre sifirlama e-postasi gonderilemedi.");
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
          Sifrenizi mi unuttunuz?
        </h1>
        <p className="mt-1 text-sm font-light text-[#5a7a8a]">
          Hesabinizla baglantili e-posta adresini girin.
        </p>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[11px] font-medium uppercase tracking-widest text-[#5a7a8a]">
              E-posta
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c96a4]" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-11 rounded-xl border-[#b5d1cc] pl-10 focus:border-[#4f8fe6] focus:ring-2 focus:ring-[#4f8fe6]/10"
                required
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-xl border border-[#f3d0d0] bg-[#fff6f6] px-4 py-3 text-sm text-[#a24b4b]">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full rounded-full bg-[#4f8fe6] font-medium text-white shadow-[0_4px_14px_rgba(79,143,230,0.3)] hover:bg-[#2f75ca]"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Reset baglantisi gonder
          </Button>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#d7eadf] bg-[#f6fbf8] px-4 py-4 text-sm text-[#335b4a]">
            Eger bu e-posta ile bir hesap varsa, sifre sifirlama baglantisi gonderildi.
          </div>
          <p className="text-sm text-[#5a7a8a]">
            E-postadaki baglantiyi kullanarak yeni sifrenizi belirleyin. Baglanti belirli bir sure sonra gecersiz olur.
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-[#5a7a8a]">
        Girisi hatirladiniz mi?{" "}
        <Link to="/auth" className="font-medium text-[#005cae] hover:underline">
          Oturum ac
        </Link>
      </p>
    </AuthScreen>
  );
}
