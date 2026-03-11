import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope, Mail, Lock, User, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("tab") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: "google" | "azure" | "facebook") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--gradient-hero)" }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden"
        style={{ background: "var(--gradient-primary)" }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.12),transparent)]" />
        <div className="relative z-10 max-w-md text-center p-12">
          <div className="mx-auto w-20 h-20 rounded-3xl bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center mb-8">
            <Stethoscope className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="text-3xl font-display font-bold text-primary-foreground mb-4">
            Welcome to MediBook
          </h2>
          <p className="text-primary-foreground/70">
            Your trusted platform for seamless healthcare appointments. Expert doctors, easy booking, exceptional care.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4">
            {["15+ Doctors", "8 Specialties", "24/7 Booking"].map((text) => (
              <div key={text} className="rounded-xl bg-primary-foreground/10 backdrop-blur-sm p-3 text-center">
                <span className="text-xs font-medium text-primary-foreground/90">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>

          <div className="glass-strong rounded-3xl p-8 shadow-elevated">
            <div className="text-center mb-8">
              <div className="lg:hidden mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center mb-4">
                <Stethoscope className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-display font-bold">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isSignUp ? "Start your health journey today" : "Sign in to manage your appointments"}
              </p>
            </div>

            {/* Social Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl"
                onClick={() => handleSocialLogin("google")}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.05 11.05 0 001 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl"
                onClick={() => handleSocialLogin("azure")}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 23 23"><path fill="#f35325" d="M1 1h10v10H1z"/><path fill="#81bc06" d="M12 1h10v10H12z"/><path fill="#05a6f0" d="M1 12h10v10H1z"/><path fill="#ffba08" d="M12 12h10v10H12z"/></svg>
                Continue with Microsoft
              </Button>
              <Button
                variant="outline"
                className="w-full h-11 rounded-xl"
                onClick={() => handleSocialLogin("facebook")}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                Continue with Facebook
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name" placeholder="Dr. John Smith"
                      value={fullName} onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-11 rounded-xl" required
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email" type="email" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl" required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password" type="password" placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 rounded-xl" required minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 rounded-xl shadow-soft" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? "Create Account" : "Sign In"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                className="text-primary font-medium hover:underline"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
