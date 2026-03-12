import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
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
  const { user, loading: authLoading, roles } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [authLoading, user, navigate]);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async ({ name, phone, avatarUrl }: { name: string; phone: string; avatarUrl?: string }) => {
      const updates: Record<string, string> = { full_name: name, phone };
      if (avatarUrl) updates.avatar_url = avatarUrl;
      const { error } = await supabase.from("profiles").update(updates).eq("user_id", user!.id);
      if (error) throw error;
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
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error } = await supabase.storage.from("appointment-files").upload(path, avatarFile, { upsert: true });
      if (error) { toast.error(t.avatarUploadFailed); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("appointment-files").getPublicUrl(path);
      avatarUrl = urlData.publicUrl;
      setUploading(false);
    }
    updateMutation.mutate({ name: fullName, phone, avatarUrl });
  };

  const initials = (fullName || user?.email || "U").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const displayAvatar = avatarPreview || profile?.avatar_url || "";

  if (authLoading || isLoading) {
    return <AppLayout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div {...fadeUp}>
          <h1 className="text-3xl font-display font-bold">{t.myProfile}</h1>
          <p className="text-muted-foreground mt-1">{t.profileDesc}</p>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.1, duration: 0.4 } as any}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.personalInfo}</CardTitle>
              <CardDescription>{t.personalInfoDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="h-20 w-20 border-2 border-border">
                      <AvatarImage src={displayAvatar} />
                      <AvatarFallback className="text-lg bg-accent text-accent-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="h-5 w-5 text-primary-foreground" />
                    </label>
                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </div>
                  <div>
                    <p className="font-medium">{fullName || t.yourName}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <div className="flex gap-1 mt-1">
                      {roles.map((role) => (
                        <span key={role} className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground capitalize">{role}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" /> {t.fullName}</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t.yourName} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {t.phone}</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="rounded-xl" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {t.email}</Label>
                  <Input value={user?.email || ""} disabled className="rounded-xl bg-muted" />
                  <p className="text-xs text-muted-foreground">{t.emailCantChange}</p>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-muted-foreground" /> {t.roles}</Label>
                  <div className="flex gap-2">
                    {roles.map((role) => (
                      <span key={role} className="text-sm font-medium px-3 py-1 rounded-lg bg-accent text-accent-foreground capitalize">{role}</span>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full sm:w-auto rounded-xl shadow-soft" disabled={updateMutation.isPending || uploading}>
                  {(updateMutation.isPending || uploading) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
