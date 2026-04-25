import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatLocalizedDateFns } from "@/lib/date-localization";
import { getAppointmentStatusLabel, normalizeAppointmentStatus } from "@/lib/status-localization";
import api from "@/services/api";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  pending: { color: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200", icon: Clock },
  confirmed: { color: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200", icon: CheckCircle2 },
  completed: { color: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200", icon: CheckCircle2 },
  cancelled: { color: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300", icon: XCircle },
};

const getPatientName = (appointment: any) =>
  [appointment?.patient?.firstName, appointment?.patient?.lastName].filter(Boolean).join(" ").trim() || "Patient";

const getDoctorName = (appointment: any) =>
  [appointment?.doctor?.firstName, appointment?.doctor?.lastName].filter(Boolean).join(" ").trim() || "Doctor";

const getDoctorTitle = (appointment: any) => appointment?.doctor?.title || "Dr.";

export default function ManageAppointments() {
  const { lang, t } = useLanguage();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");

  const { data: appointments } = useQuery({
    queryKey: ["admin-all-appointments"],
    queryFn: async () => {
      const data = await api.appointments.list();
      return data.sort(
        (a: any, b: any) =>
          new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime(),
      );
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      api.appointments.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-all-appointments"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      setSelected(null);
      toast.success(t.appointmentStatusUpdated);
    },
  });

  const filtered =
    appointments?.filter((appointment: any) => {
      const query = search.toLowerCase();
      const matchesSearch =
        !query ||
        getPatientName(appointment).toLowerCase().includes(query) ||
        getDoctorName(appointment).toLowerCase().includes(query);

      return matchesSearch && (tab === "all" || normalizeAppointmentStatus(appointment.status) === tab);
    }) ?? [];

  const counts: Record<string, number> = { all: appointments?.length ?? 0 };
  appointments?.forEach((appointment: any) => {
    const status = normalizeAppointmentStatus(appointment.status);
    counts[status] = (counts[status] ?? 0) + 1;
  });

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>
            {t.manageAppointments}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {appointments?.length ?? 0} {t.totalAppointments}
          </p>
        </motion.div>

        <motion.div custom={1} variants={fadeUp} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.searchByPatientOrDoctor}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </motion.div>

        <motion.div custom={2} variants={fadeUp}>
          <div className="overflow-x-auto">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="gap-[2px] rounded-xl border border-border bg-muted/60 p-1">
                <TabsTrigger value="all" style={{ borderRadius: "9px", fontSize: "0.85rem" }}>
                  {t.all} ({counts.all})
                </TabsTrigger>
                <TabsTrigger value="pending" style={{ borderRadius: "9px", fontSize: "0.85rem" }}>
                  {t.pending} ({counts.pending ?? 0})
                </TabsTrigger>
                <TabsTrigger value="confirmed" style={{ borderRadius: "9px", fontSize: "0.85rem" }}>
                  {t.confirmed} ({counts.confirmed ?? 0})
                </TabsTrigger>
                <TabsTrigger value="completed" style={{ borderRadius: "9px", fontSize: "0.85rem" }}>
                  {t.completed} ({counts.completed ?? 0})
                </TabsTrigger>
                <TabsTrigger value="cancelled" style={{ borderRadius: "9px", fontSize: "0.85rem" }}>
                  {t.cancelled} ({counts.cancelled ?? 0})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        <motion.div custom={3} variants={fadeUp}>
          <Card className="overflow-visible rounded-2xl border border-border bg-card shadow-sm">
            <CardContent className="p-0">
              <div className="max-h-[560px] overflow-x-auto overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left">
                      <th className="p-4 text-sm font-medium text-muted-foreground">{t.patient}</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">{t.doctor}</th>
                      <th className="hidden p-4 text-sm font-medium text-muted-foreground md:table-cell">{t.date}</th>
                      <th className="hidden p-4 text-sm font-medium text-muted-foreground lg:table-cell">{t.time}</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">{t.status}</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((appointment: any) => {
                      const normalizedStatus = normalizeAppointmentStatus(appointment.status);
                      const cfg = statusConfig[normalizedStatus] ?? statusConfig.pending;

                      return (
                        <tr key={appointment.id} className="border-b border-border bg-card transition-colors hover:bg-muted/40">
                          <td className="p-4 text-sm font-medium text-foreground">{getPatientName(appointment)}</td>
                          <td className="p-4 text-sm text-foreground">{getDoctorTitle(appointment)} {getDoctorName(appointment)}</td>
                          <td className="hidden p-4 text-sm text-muted-foreground md:table-cell">
                            {formatLocalizedDateFns(new Date(appointment.appointment_date), "MMM d, yyyy", lang)}
                          </td>
                          <td className="hidden p-4 text-sm text-muted-foreground lg:table-cell">
                            {appointment.start_time?.slice(0, 5)}
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className={cfg.color}>
                              {getAppointmentStatusLabel(appointment.status, t)}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary"
                              onClick={() => {
                                setSelected(appointment);
                                setNewStatus(normalizedStatus);
                              }}
                            >
                              {t.manage}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}

                    {!filtered.length && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          —
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.manageAppointment}</DialogTitle>
          </DialogHeader>

          {selected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t.patient}:</span>
                  <p className="font-medium text-foreground">{getPatientName(selected)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.doctor}:</span>
                  <p className="font-medium text-foreground">{getDoctorTitle(selected)} {getDoctorName(selected)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.date}:</span>
                  <p className="font-medium text-foreground">
                    {formatLocalizedDateFns(new Date(selected.appointment_date), "MMM d, yyyy", lang)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t.time}:</span>
                  <p className="font-medium text-foreground">
                    {selected.start_time?.slice(0, 5)} – {selected.end_time?.slice(0, 5)}
                  </p>
                </div>
              </div>

              {selected.notes ? (
                <div className="text-sm">
                  <span className="text-muted-foreground">{t.notes}:</span>
                  <p className="mt-1 rounded-lg bg-muted/50 p-3 text-foreground">{selected.notes}</p>
                </div>
              ) : null}

              <div>
                <span className="text-sm text-muted-foreground">{t.updateStatus}</span>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t.pending}</SelectItem>
                    <SelectItem value="confirmed">{t.confirmed}</SelectItem>
                    <SelectItem value="completed">{t.completed}</SelectItem>
                    <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              {t.close}
            </Button>
            <Button
              onClick={() => updateStatus.mutate({ id: selected.id, status: newStatus })}
              disabled={updateStatus.isPending || newStatus === selected?.status}
            >
              {t.updateStatus}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
