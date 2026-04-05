import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Search, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }) };

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  pending: { color: "bg-[#fff8e6] text-[#f5a623] border-[#f5a623]/30", icon: Clock },
  confirmed: { color: "bg-[#eaf5ff] text-[#4f8fe6] border-[#b5d1cc]", icon: CheckCircle2 },
  completed: { color: "bg-[#e6f4ef] text-[#65a98f] border-[#b5d1cc]", icon: CheckCircle2 },
  cancelled: { color: "bg-[#fef2f2] text-[#e05252] border-[#fca5a5]/30", icon: XCircle },
};

const getPatientName = (appointment: any) =>
  [appointment?.patient?.firstName, appointment?.patient?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || "Patient";

const getDoctorName = (appointment: any) =>
  [appointment?.doctor?.firstName, appointment?.doctor?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || "Doctor";

const getDoctorTitle = (appointment: any) =>
  appointment?.doctor?.title || "Dr.";

export default function ManageAppointments() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");

  const { data: appointments } = useQuery({
    queryKey: ["admin-all-appointments"],
    queryFn: async () => {
      const data = await api.appointments.list();
      return data
        .sort((a: any, b: any) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());
    },
  });
  const updateStatus = useMutation({ mutationFn: async ({ id, status }: { id: string; status: string }) => api.appointments.updateStatus(id, status), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-all-appointments"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); setSelected(null); toast.success(t.appointmentStatusUpdated); } });

  const filtered = appointments?.filter((a: any) => { const q = search.toLowerCase(); const matchesSearch = !q || getPatientName(a).toLowerCase().includes(q) || getDoctorName(a).toLowerCase().includes(q); return matchesSearch && (tab === "all" || a.status === tab); }) ?? [];
  const counts: Record<string, number> = { all: appointments?.length ?? 0 }; appointments?.forEach((a: any) => { counts[a.status] = (counts[a.status] ?? 0) + 1; });

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}><h1 className="text-3xl font-display font-bold" style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>{t.manageAppointments}</h1><p className="text-muted-foreground mt-1" style={{ color: "#5a7a8a" }}>{appointments?.length ?? 0} {t.totalAppointments}</p></motion.div>
        <motion.div custom={1} variants={fadeUp} className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t.searchByPatientOrDoctor} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></motion.div>
        <motion.div custom={2} variants={fadeUp}><div style={{ overflowX: "auto" }}><Tabs value={tab} onValueChange={setTab}><TabsList style={{ background: "#f4f8fd", border: "1px solid #b5d1cc", borderRadius: "12px", padding: "4px", gap: "2px" }}><TabsTrigger value="all" style={{ borderRadius: "9px", fontSize: "0.85rem" }}>{t.all} ({counts.all})</TabsTrigger><TabsTrigger value="pending" style={{ borderRadius: "9px", fontSize: "0.85rem" }}>{t.pending} ({counts.pending ?? 0})</TabsTrigger><TabsTrigger value="confirmed" style={{ borderRadius: "9px", fontSize: "0.85rem" }}>{t.confirmed} ({counts.confirmed ?? 0})</TabsTrigger><TabsTrigger value="completed" style={{ borderRadius: "9px", fontSize: "0.85rem" }}>{t.completed} ({counts.completed ?? 0})</TabsTrigger><TabsTrigger value="cancelled" style={{ borderRadius: "9px", fontSize: "0.85rem" }}>{t.cancelled} ({counts.cancelled ?? 0})</TabsTrigger></TabsList></Tabs></div></motion.div>
        <motion.div custom={3} variants={fadeUp}>
          <Card style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", boxShadow: "0 2px 12px rgba(79,143,230,0.08)", overflow: "hidden" }}><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left" style={{ background: "#f4f8fd", borderBottom: "1px solid #b5d1cc" }}><th className="p-4 text-sm font-medium text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.8rem", fontWeight: 600, padding: "12px 16px" }}>{t.patient}</th><th className="p-4 text-sm font-medium text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.8rem", fontWeight: 600, padding: "12px 16px" }}>{t.doctor}</th><th className="p-4 text-sm font-medium text-muted-foreground hidden md:table-cell" style={{ color: "#5a7a8a", fontSize: "0.8rem", fontWeight: 600, padding: "12px 16px" }}>{t.date}</th><th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell" style={{ color: "#5a7a8a", fontSize: "0.8rem", fontWeight: 600, padding: "12px 16px" }}>{t.time}</th><th className="p-4 text-sm font-medium text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.8rem", fontWeight: 600, padding: "12px 16px" }}>{t.status}</th><th className="p-4 text-sm font-medium text-muted-foreground text-right" style={{ color: "#5a7a8a", fontSize: "0.8rem", fontWeight: 600, padding: "12px 16px" }}>{t.actions}</th></tr></thead>
          <tbody>{filtered.map((apt: any) => { const cfg = statusConfig[apt.status] ?? statusConfig.pending; return (<tr key={apt.id} style={{ borderBottom: "1px solid #f0f4f8" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f4f8fd"} onMouseLeave={(e) => e.currentTarget.style.background = "white"}><td className="p-4 text-sm font-medium" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.875rem", padding: "12px 16px" }}>{getPatientName(apt)}</td><td className="p-4 text-sm" style={{ color: "#1a2e3b", fontSize: "0.875rem", padding: "12px 16px" }}>{getDoctorTitle(apt)} {getDoctorName(apt)}</td><td className="p-4 hidden md:table-cell text-sm text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem", padding: "12px 16px" }}>{format(new Date(apt.appointment_date), "MMM d, yyyy")}</td><td className="p-4 hidden lg:table-cell text-sm text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem", padding: "12px 16px" }}>{apt.start_time?.slice(0, 5)}</td><td className="p-4"><Badge variant="outline" className={cfg.color}>{apt.status}</Badge></td><td className="p-4 text-right"><Button variant="ghost" size="sm" onClick={() => { setSelected(apt); setNewStatus(apt.status); }} style={{ color: "#4f8fe6", fontWeight: 500, fontSize: "0.8rem" }}>{t.manage}</Button></td></tr>); })}{!filtered.length && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">—</td></tr>}</tbody></table></div></CardContent></Card>
        </motion.div>
      </motion.div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent><DialogHeader><DialogTitle>{t.manageAppointment}</DialogTitle></DialogHeader>
          {selected && (<div className="space-y-4"><div className="grid grid-cols-2 gap-4 text-sm"><div><span className="text-muted-foreground">{t.patient}:</span><p className="font-medium">{getPatientName(selected)}</p></div><div><span className="text-muted-foreground">{t.doctor}:</span><p className="font-medium">{getDoctorTitle(selected)} {getDoctorName(selected)}</p></div><div><span className="text-muted-foreground">{t.date}:</span><p className="font-medium">{format(new Date(selected.appointment_date), "MMM d, yyyy")}</p></div><div><span className="text-muted-foreground">{t.time}:</span><p className="font-medium">{selected.start_time?.slice(0, 5)} – {selected.end_time?.slice(0, 5)}</p></div></div>{selected.notes && <div className="text-sm"><span className="text-muted-foreground">{t.notes}:</span><p className="mt-1 p-3 rounded-lg bg-muted/50">{selected.notes}</p></div>}<div><span className="text-sm text-muted-foreground">{t.updateStatus}</span><Select value={newStatus} onValueChange={setNewStatus}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">{t.pending}</SelectItem><SelectItem value="confirmed">{t.confirmed}</SelectItem><SelectItem value="completed">{t.completed}</SelectItem><SelectItem value="cancelled">{t.cancelled}</SelectItem></SelectContent></Select></div></div>)}
          <DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>{t.close}</Button><Button onClick={() => updateStatus.mutate({ id: selected.id, status: newStatus })} disabled={updateStatus.isPending || newStatus === selected?.status}>{t.updateStatus}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
