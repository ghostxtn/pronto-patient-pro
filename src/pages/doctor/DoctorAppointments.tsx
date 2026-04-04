import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMyDoctorProfile } from "@/hooks/useMyDoctorProfile";
import AppLayout from "@/components/AppLayout";
import { AppointmentDetailSheet } from "@/components/appointments/AppointmentDetailSheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { parseCalendarDate } from "@/utils/calendarUtils";
import { CalendarDays, Clock, CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";
import type { Appointment } from "@/types/calendar";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }),
};

interface AppointmentProfile {
  id?: string;
  full_name?: string;
  email?: string;
  phone?: string;
}

interface DoctorAppointmentRow {
  id: string;
  doctor_id: string;
  patient_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  type?: string;
  notes?: string;
  profiles: AppointmentProfile | null;
}

export default function DoctorAppointments() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [detailId, setDetailId] = useState<string | null>(null);

  const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    pending: { color: "bg-warning/10 text-warning border-warning/20", icon: AlertCircle, label: t.pending },
    confirmed: { color: "bg-success/10 text-success border-success/20", icon: CheckCircle2, label: t.confirmed },
    completed: { color: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle2, label: t.completed },
    cancelled: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle, label: t.cancelled },
    no_show: { color: "bg-slate-200 text-slate-700 border-slate-300", icon: XCircle, label: "Gelmedi" },
  };

  const { data: doctorRecord } = useMyDoctorProfile();
  const { data: appointments, isLoading } = useQuery<DoctorAppointmentRow[]>({
    queryKey: ["doctor-appointments-list", doctorRecord?.id],
    queryFn: async () => {
      const data = await api.appointments.list({ doctor_id: doctorRecord!.id }) as Array<{
        id: string;
        doctor_id: string;
        patient_id: string;
        appointment_date: string;
        start_time: string;
        end_time: string;
        status: string;
        type?: string;
        notes?: string;
        profiles?: AppointmentProfile | null;
        profile?: AppointmentProfile | null;
        patient?: AppointmentProfile | null;
      }>;
      return data
        .map((appointment) => ({
          ...appointment,
          profiles:
            appointment.profiles ??
            appointment.profile ??
            appointment.patient ??
            null,
        }))
        .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime());
    },
    enabled: !!doctorRecord?.id,
  });
  const updateStatus = useMutation({ mutationFn: async ({ id, status }: { id: string; status: string }) => api.appointments.updateStatus(id, status), onSuccess: () => { toast.success(t.appointmentUpdated); queryClient.invalidateQueries({ queryKey: ["doctor-appointments-list"] }); queryClient.invalidateQueries({ queryKey: ["doctor-all-appointments"] }); }, onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to update appointment") });

  const pending = appointments?.filter((a) => a.status === "pending") || [];
  const confirmed = appointments?.filter((a) => a.status === "confirmed") || [];
  const completed = appointments?.filter((a) => a.status === "completed") || [];
  const cancelled = appointments?.filter((a) => a.status === "cancelled") || [];
  const noShow = appointments?.filter((a) => a.status === "no_show") || [];
  const selectedAppointment = appointments?.find((a) => a.id === detailId);
  const selectedAppointmentDetail: Appointment | null = selectedAppointment
    ? {
        id: selectedAppointment.id,
        doctor_id: selectedAppointment.doctor_id,
        patient_id: selectedAppointment.patient_id,
        appointment_date: selectedAppointment.appointment_date,
        start_time: selectedAppointment.start_time,
        end_time: selectedAppointment.end_time,
        status: selectedAppointment.status,
        type: selectedAppointment.type ?? "",
        notes: selectedAppointment.notes,
        patient: {
          id: selectedAppointment.profiles?.id ?? selectedAppointment.patient_id,
          firstName: selectedAppointment.profiles?.full_name?.split(" ")[0] ?? "",
          lastName: selectedAppointment.profiles?.full_name?.split(" ").slice(1).join(" ") ?? "",
          fullName: selectedAppointment.profiles?.full_name ?? t.patient,
          email: selectedAppointment.profiles?.email,
          phone: selectedAppointment.profiles?.phone,
        },
      }
    : null;

  const renderList = (list: typeof appointments) => {
    if (!list || list.length === 0) return <div className="text-center py-12 text-muted-foreground text-sm">{t.noAppointmentsInCategory}</div>;
    return (
      <div className="space-y-3">
        {list.map((apt, i) => { const patient = apt.profiles; const status = statusConfig[apt.status] ?? statusConfig.pending; const StatusIcon = status.icon; return (
          <motion.div key={apt.id} className="glass rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all cursor-pointer" custom={i} variants={fadeUp} initial="hidden" animate="visible" onClick={() => { setDetailId(apt.id); }}>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-secondary to-success flex items-center justify-center flex-shrink-0"><span className="text-secondary-foreground font-display font-bold">{patient?.full_name?.[0] || "P"}</span></div>
                <div className="min-w-0"><div className="font-display font-semibold truncate">{patient?.full_name || t.patient}</div><div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5"><span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{format(parseCalendarDate(apt.appointment_date), "MMM d, yyyy")}</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{apt.start_time.slice(0, 5)}</span></div></div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {apt.status === "confirmed" && <Button size="sm" variant="outline" className="rounded-full text-xs" onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: apt.id, status: "completed" }); }}><CheckCircle2 className="h-3 w-3 mr-1" /> {t.complete}</Button>}
                <Badge className={cn("rounded-full border", status.color)} variant="outline"><StatusIcon className="h-3 w-3 mr-1" /><span className="hidden sm:inline">{status.label}</span></Badge>
              </div>
            </div>
            {apt.notes && <div className="mt-3 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground flex items-start gap-2"><FileText className="h-3 w-3 mt-0.5 flex-shrink-0" /><span className="line-clamp-1">{apt.notes}</span></div>}
          </motion.div>
        ); })}
      </div>
    );
  };

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible">
        <motion.div className="mb-8" custom={0} variants={fadeUp}><h1 className="text-3xl font-display font-bold mb-2">{t.appointments}</h1><p className="text-muted-foreground">{t.appointmentsDesc}</p></motion.div>
        <Tabs defaultValue="pending">
          <motion.div custom={1} variants={fadeUp}>
            <TabsList className="rounded-xl mb-6">
              <TabsTrigger value="pending" className="rounded-lg">{t.pending} ({pending.length})</TabsTrigger>
              <TabsTrigger value="confirmed" className="rounded-lg">{t.confirmed} ({confirmed.length})</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg">{t.completed} ({completed.length})</TabsTrigger>
              <TabsTrigger value="cancelled" className="rounded-lg">{t.cancelled} ({cancelled.length})</TabsTrigger>
              <TabsTrigger value="no_show" className="rounded-lg">Gelmedi ({noShow.length})</TabsTrigger>
            </TabsList>
          </motion.div>
          {isLoading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="glass rounded-2xl p-5 shadow-card animate-pulse h-20" />)}</div> : (<><TabsContent value="pending">{renderList(pending)}</TabsContent><TabsContent value="confirmed">{renderList(confirmed)}</TabsContent><TabsContent value="completed">{renderList(completed)}</TabsContent><TabsContent value="cancelled">{renderList(cancelled)}</TabsContent><TabsContent value="no_show">{renderList(noShow)}</TabsContent></>)}
        </Tabs>
      </motion.div>

      <AppointmentDetailSheet
        appointment={selectedAppointmentDetail}
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        onStatusUpdate={(id, status) => updateStatus.mutate({ id, status })}
      />
    </AppLayout>
  );
}
