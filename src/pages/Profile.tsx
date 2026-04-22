import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Camera, Loader2, Mail, Phone, Save, Shield, User } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/services/api";
import { getRoleLabel } from "@/lib/role-localization";

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
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t.imageMaxSize);
      return;
    }
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

  const initials = [firstName, lastName]
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "U";
  const displayAvatar = avatarPreview || profile?.avatar_url || "";

  if (!authLoading && user?.role === "patient" && location.pathname === "/profile") {
    return <Navigate to="/patient/profile" replace />;
  }

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <motion.div {...fadeUp}>
          <h1 className="text-3xl font-display font-bold text-foreground">{t.myProfile}</h1>
          <p className="mt-1 text-muted-foreground">{t.profileDesc}</p>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.1, duration: 0.4 } as any}>
          <Card className="rounded-2xl border-border bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">{t.personalInfo}</CardTitle>
              <CardDescription>{t.personalInfoDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="group relative">
                    <Avatar className="h-20 w-20 border-2 border-border">
                      <AvatarImage src={displayAvatar} />
                      <AvatarFallback className="bg-primary/10 text-[1.1rem] font-bold text-primary">{initials}</AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Camera className="h-5 w-5 text-primary-foreground" />
                    </label>
                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{[firstName, lastName].filter(Boolean).join(" ") || t.yourName}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <div className="mt-1 flex gap-1">
                      {roles.map((role) => (
                        <span key={role} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                          {getRoleLabel(role, t)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {t.firstName || "Ad"}
                    </Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ad" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {t.lastName || "Soyad"}
                    </Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Soyad" className="rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {t.email}
                  </Label>
                  <Input value={user?.email || ""} disabled className="rounded-xl bg-muted" />
                  <p className="text-xs text-muted-foreground">{t.emailCantChange}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    {t.roles}
                  </Label>
                  <div className="flex gap-2">
                    {roles.map((role) => (
                      <span key={role} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {getRoleLabel(role, t)}
                      </span>
                    ))}
                  </div>
                </div>

                <Button type="submit" disabled={updateMutation.isPending || uploading} className="inline-flex rounded-xl px-6">
                  {updateMutation.isPending || uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {t.saveChanges}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
