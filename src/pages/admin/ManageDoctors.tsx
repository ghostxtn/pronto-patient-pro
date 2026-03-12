import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Search, Edit, UserCheck, UserX } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }) };

export default function ManageDoctors() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editDoctor, setEditDoctor] = useState<any>(null);

  const { data: specializations } = useQuery({ queryKey: ["specializations"], queryFn: async () => { const { data } = await supabase.from("specializations").select("*"); return data ?? []; } });
  const { data: doctors } = useQuery({ queryKey: ["admin-doctors"], queryFn: async () => { const { data } = await supabase.from("doctors").select("*, specializations(name), profiles:user_id(full_name, email, avatar_url)").order("created_at", { ascending: false }); return data ?? []; } });

  const toggleActive = useMutation({ mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => { const { error } = await supabase.from("doctors").update({ is_active }).eq("id", id); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-doctors"] }); toast.success(t.doctorStatusUpdated); } });
  const updateDoctor = useMutation({ mutationFn: async (doc: any) => { const { error } = await supabase.from("doctors").update({ specialization_id: doc.specialization_id, bio: doc.bio, consultation_fee: doc.consultation_fee, experience_years: doc.experience_years }).eq("id", doc.id); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-doctors"] }); setEditDoctor(null); toast.success(t.doctorUpdated); } });

  const filtered = doctors?.filter((d: any) => { const q = search.toLowerCase(); return (d.profiles?.full_name?.toLowerCase() ?? "").includes(q) || (d.profiles?.email?.toLowerCase() ?? "").includes(q); }) ?? [];

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}><h1 className="text-3xl font-display font-bold">{t.manageDoctors}</h1><p className="text-muted-foreground mt-1">{doctors?.length ?? 0} {t.registeredDoctors}</p></motion.div>
        <motion.div custom={1} variants={fadeUp} className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t.searchByNameOrEmail} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></motion.div>
        <motion.div custom={2} variants={fadeUp}>
          <Card className="shadow-card"><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b text-left"><th className="p-4 text-sm font-medium text-muted-foreground">{t.doctor}</th><th className="p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">{t.specialization}</th><th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">{t.experience}</th><th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">{t.fee}</th><th className="p-4 text-sm font-medium text-muted-foreground">{t.status}</th><th className="p-4 text-sm font-medium text-muted-foreground text-right">{t.actions}</th></tr></thead>
          <tbody>{filtered.map((doc: any) => (<tr key={doc.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors"><td className="p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-primary-foreground font-bold text-sm">{doc.profiles?.full_name?.[0] ?? "D"}</div><div><p className="font-medium text-sm">{doc.profiles?.full_name ?? "Unknown"}</p><p className="text-xs text-muted-foreground">{doc.profiles?.email}</p></div></div></td><td className="p-4 hidden md:table-cell"><Badge variant="outline">{doc.specializations?.name ?? "None"}</Badge></td><td className="p-4 hidden lg:table-cell text-sm">{doc.experience_years ?? 0} yrs</td><td className="p-4 hidden lg:table-cell text-sm">${doc.consultation_fee ?? 0}</td><td className="p-4"><Badge variant="outline" className={doc.is_active ? "bg-success/15 text-success border-success/30" : "bg-destructive/15 text-destructive border-destructive/30"}>{doc.is_active ? t.active : t.inactive}</Badge></td><td className="p-4 text-right"><div className="flex items-center justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => setEditDoctor({ ...doc })}><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => toggleActive.mutate({ id: doc.id, is_active: !doc.is_active })}>{doc.is_active ? <UserX className="h-4 w-4 text-destructive" /> : <UserCheck className="h-4 w-4 text-success" />}</Button></div></td></tr>))}{!filtered.length && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">{t.noDoctorsFound}</td></tr>}</tbody></table></div></CardContent></Card>
        </motion.div>
      </motion.div>

      <Dialog open={!!editDoctor} onOpenChange={() => setEditDoctor(null)}>
        <DialogContent><DialogHeader><DialogTitle>{t.editDoctor}</DialogTitle></DialogHeader>
          {editDoctor && (<div className="space-y-4"><div><Label>{t.specialization}</Label><Select value={editDoctor.specialization_id ?? ""} onValueChange={(v) => setEditDoctor({ ...editDoctor, specialization_id: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{specializations?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div><div><Label>{t.bio}</Label><Textarea value={editDoctor.bio ?? ""} onChange={(e) => setEditDoctor({ ...editDoctor, bio: e.target.value })} /></div><div className="grid grid-cols-2 gap-4"><div><Label>{t.consultationFee}</Label><Input type="number" value={editDoctor.consultation_fee ?? 0} onChange={(e) => setEditDoctor({ ...editDoctor, consultation_fee: +e.target.value })} /></div><div><Label>{t.experienceYears}</Label><Input type="number" value={editDoctor.experience_years ?? 0} onChange={(e) => setEditDoctor({ ...editDoctor, experience_years: +e.target.value })} /></div></div></div>)}
          <DialogFooter><Button variant="outline" onClick={() => setEditDoctor(null)}>{t.cancel}</Button><Button onClick={() => updateDoctor.mutate(editDoctor)} disabled={updateDoctor.isPending}>{t.saveChanges}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
