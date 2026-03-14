import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Settings, Plus, Trash2, Stethoscope } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }) };

export default function ClinicSettings() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [showAddSpec, setShowAddSpec] = useState(false);
  const [specName, setSpecName] = useState("");
  const [specDesc, setSpecDesc] = useState("");

  const { data: specializations } = useQuery({ queryKey: ["specializations"], queryFn: async () => api.specializations.list() });
  const addSpec = useMutation({ mutationFn: async () => api.specializations.create({ name: specName, description: specDesc || undefined }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["specializations"] }); setShowAddSpec(false); setSpecName(""); setSpecDesc(""); toast.success(t.specAdded); }, onError: () => toast.error(t.specAddFailed) });
  const deleteSpec = useMutation({ mutationFn: async (id: string) => api.specializations.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["specializations"] }); toast.success(t.specDeleted); }, onError: () => toast.error(t.specDeleteFailed) });

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}><h1 className="text-3xl font-display font-bold">{t.clinicSettings}</h1><p className="text-muted-foreground mt-1">{t.clinicSettingsDesc}</p></motion.div>

        <motion.div custom={1} variants={fadeUp}>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="flex items-center gap-2 text-lg"><Stethoscope className="h-5 w-5 text-primary" />{t.specializations}</CardTitle><CardDescription>{t.specManageDesc}</CardDescription></div><Button size="sm" onClick={() => setShowAddSpec(true)}><Plus className="h-4 w-4 mr-1" /> {t.add}</Button></CardHeader>
            <CardContent>{!specializations?.length ? <p className="text-muted-foreground text-sm text-center py-4">—</p> : (<div className="space-y-2">{specializations.map((s) => (<div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"><div><p className="font-medium text-sm">{s.name}</p>{s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}</div><div className="flex items-center gap-2"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSpec.mutate(s.id)}><Trash2 className="h-4 w-4" /></Button></div></div>))}</div>)}</CardContent>
          </Card>
        </motion.div>

        <motion.div custom={2} variants={fadeUp}>
          <Card className="shadow-card"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Settings className="h-5 w-5 text-primary" />{t.generalSettings}</CardTitle><CardDescription>{t.generalSettingsDesc}</CardDescription></CardHeader><CardContent><div className="grid sm:grid-cols-2 gap-4"><div><Label>{t.clinicName}</Label><Input defaultValue="MediBook Clinic" className="mt-1" /></div><div><Label>{t.contactEmail}</Label><Input defaultValue="admin@medibook.com" className="mt-1" /></div><div><Label>{t.contactPhone}</Label><Input defaultValue="+1 (555) 000-0000" className="mt-1" /></div><div><Label>{t.defaultSlotDuration}</Label><Input type="number" defaultValue={30} className="mt-1" /></div></div><Button className="mt-6">{t.saveSettings}</Button></CardContent></Card>
        </motion.div>
      </motion.div>

      <Dialog open={showAddSpec} onOpenChange={setShowAddSpec}>
        <DialogContent><DialogHeader><DialogTitle>{t.addSpecialization}</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>{t.name} *</Label><Input value={specName} onChange={(e) => setSpecName(e.target.value)} /></div><div><Label>{t.description}</Label><Input value={specDesc} onChange={(e) => setSpecDesc(e.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => setShowAddSpec(false)}>{t.cancel}</Button><Button onClick={() => addSpec.mutate()} disabled={!specName.trim() || addSpec.isPending}>{t.addSpecialization}</Button></DialogFooter></DialogContent>
      </Dialog>
    </AppLayout>
  );
}
