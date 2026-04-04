import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2, Plus, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/services/api";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function ClinicSettings() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isOwner = user?.role === "owner";
  const [showAddSpec, setShowAddSpec] = useState(false);
  const [specName, setSpecName] = useState("");
  const [specDesc, setSpecDesc] = useState("");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [uploadingSpecIds, setUploadingSpecIds] = useState<Record<string, boolean>>({});

  const { data: specializations } = useQuery({
    queryKey: ["specializations"],
    queryFn: async () => api.specializations.list(),
  });

  const addSpec = useMutation({
    mutationFn: async () => api.specializations.create({ name: specName, description: specDesc || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["specializations"] });
      setShowAddSpec(false);
      setSpecName("");
      setSpecDesc("");
      toast.success(t.specAdded);
    },
    onError: () => toast.error(t.specAddFailed),
  });

  const deleteSpec = useMutation({
    mutationFn: async (id: string) => api.specializations.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["specializations"] });
      toast.success(t.specDeleted);
    },
    onError: () => toast.error(t.specDeleteFailed),
  });

  const handleSpecImageUpload = async (specId: string, file?: File) => {
    if (!file) return;

    setUploadingSpecIds((current) => ({ ...current, [specId]: true }));

    try {
      await api.specializations.uploadImage(specId, file);
      await qc.invalidateQueries({ queryKey: ["specializations"] });
      toast.success("Uzmanlik gorseli yuklendi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gorsel yuklenemedi");
    } finally {
      setUploadingSpecIds((current) => ({ ...current, [specId]: false }));
    }
  };

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold">{t.clinicSettings}</h1>
          <p className="text-muted-foreground mt-1">{t.clinicSettingsDesc}</p>
        </motion.div>

        {(isOwner || user?.role === "admin") && (
          <motion.div custom={1} variants={fadeUp}>
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    {t.ownerControls}
                  </CardTitle>
                  <CardDescription>{t.ownerControlsDesc}</CardDescription>
                </div>
                <Badge variant="outline">{t.ownerOnly}</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium">{t.specializations}</h3>
                    <p className="text-sm text-muted-foreground">{t.specManageDesc}</p>
                  </div>
                  <Button size="sm" onClick={() => setShowAddSpec(true)}>
                    <Plus className="h-4 w-4 mr-1" /> {t.add}
                  </Button>
                </div>
                {!specializations?.length ? (
                  <p className="text-muted-foreground text-sm text-center py-4">—</p>
                ) : (
                  <div className="space-y-2">
                    {specializations.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                        <div className="flex items-center gap-3">
                          {s.imageUrl ? (
                            <img
                              src={s.imageUrl}
                              alt={s.name}
                              className="h-[52px] w-[52px] rounded-lg object-cover"
                            />
                          ) : (
                            <div
                              className="flex h-[52px] w-[52px] items-center justify-center rounded-lg text-center text-[11px]"
                              style={{
                                background: "linear-gradient(135deg,#eaf5ff,#b5d1cc)",
                                color: "#5a7a8a",
                              }}
                            >
                              Görsel yok
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{s.name}</p>
                            {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            ref={(element) => {
                              fileInputRefs.current[s.id] = element;
                            }}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              void handleSpecImageUpload(s.id, file);
                              event.target.value = "";
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRefs.current[s.id]?.click()}
                            disabled={!!uploadingSpecIds[s.id]}
                          >
                            {uploadingSpecIds[s.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Görsel Yükle
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSpec.mutate(s.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>

      <Dialog open={showAddSpec} onOpenChange={setShowAddSpec}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.addSpecialization}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.name} *</Label>
              <Input value={specName} onChange={(e) => setSpecName(e.target.value)} />
            </div>
            <div>
              <Label>{t.description}</Label>
              <Input value={specDesc} onChange={(e) => setSpecDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSpec(false)}>{t.cancel}</Button>
            <Button onClick={() => addSpec.mutate()} disabled={!specName.trim() || addSpec.isPending}>{t.addSpecialization}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
