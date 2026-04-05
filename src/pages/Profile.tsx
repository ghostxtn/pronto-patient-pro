import { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Camera, Loader2, Save, User, Phone, Mail, Shield } from "lucide-react";
import { toast } from "sonner";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 } as const,
};

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const roles = user?.role ? [user.role] : [];
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => api.profiles.me(),
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async ({ firstName, lastName, avatarUrl }: { firstName: string; lastName: string; avatarUrl?: string }) => {
      const updates: Record<string, string> = { firstName, lastName };
      if (avatarUrl) updates.avatarUrl = avatarUrl;
      return api.profiles.update("me", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success(t.profileUpdated);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error(t.imageMaxSize); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let avatarUrl: string | undefined;
    if (avatarFile && user) {
      setUploading(true);
      try {
        const response = await api.storage.uploadAvatar(avatarFile);
        avatarUrl = response.url;
      } catch (err: any) {
        toast.error(err.message || t.avatarUploadFailed);
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    updateMutation.mutate({ firstName, lastName, avatarUrl });
  };

  const initials = [firstName, lastName].filter(Boolean).map((w) => w[0]).join("").toUpperCase() || "U";
  const displayAvatar = avatarPreview || profile?.avatar_url || "";

  if (!authLoading && user?.role === "patient" && location.pathname === "/profile") {
    return <Navigate to="/patient/profile" replace />;
  }

  if (authLoading || isLoading) {
    return <AppLayout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div {...fadeUp}>
          <h1 className="text-3xl font-display font-bold" style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>{t.myProfile}</h1>
          <p className="text-muted-foreground mt-1" style={{ color: "#5a7a8a" }}>{t.profileDesc}</p>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.1, duration: 0.4 } as any}>
          <Card style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", boxShadow: "0 2px 12px rgba(79,143,230,0.08)" }}>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>{t.personalInfo}</CardTitle>
              <CardDescription style={{ color: "#5a7a8a" }}>{t.personalInfoDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-20 w-20" style={{ border: "2px solid #b5d1cc", borderRadius: "50%" }}>
                      <AvatarImage src={displayAvatar} />
                      <AvatarFallback style={{ background: "#eaf5ff", color: "#4f8fe6", fontSize: "1.1rem", fontWeight: 700 }}>{initials}</AvatarFallback>
                    </Avatar>
                    <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-5 w-5 text-primary-foreground" />
                    </label>
                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: "#1a2e3b", fontWeight: 600 }}>{[firstName, lastName].filter(Boolean).join(" ") || t.yourName}</p>
                    <p className="text-sm text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem" }}>{user?.email}</p>
                    <div className="flex gap-1 mt-1">
                      {roles.map((role) => (
                        <span key={role} style={{ background: "#eaf5ff", color: "#4f8fe6", fontSize: "0.75rem", fontWeight: 600, padding: "2px 10px", borderRadius: "999px" }}>{role}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" style={{ color: "#b5d1cc", width: 14, height: 14 }} /> {t.firstName || "Ad"}</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ad" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" style={{ color: "#b5d1cc", width: 14, height: 14 }} /> {t.lastName || "Soyad"}</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Soyad" className="rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" style={{ color: "#b5d1cc", width: 14, height: 14 }} /> {t.email}</Label>
                  <Input value={user?.email || ""} disabled className="rounded-xl bg-muted" />
                  <p className="text-xs text-muted-foreground">{t.emailCantChange}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-muted-foreground" style={{ color: "#b5d1cc", width: 14, height: 14 }} /> {t.roles}</Label>
                  <div className="flex gap-2">
                    {roles.map((role) => (
                      <span key={role} style={{ background: "#eaf5ff", color: "#4f8fe6", fontSize: "0.75rem", fontWeight: 600, padding: "2px 10px", borderRadius: "999px" }}>{role}</span>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={updateMutation.isPending || uploading} style={{ background: "#4f8fe6", color: "white", borderRadius: "12px", padding: "10px 24px", fontWeight: 600, border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px", opacity: (updateMutation.isPending || uploading) ? 0.7 : 1 }}>
                  {(updateMutation.isPending || uploading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {t.saveChanges}
                </button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
