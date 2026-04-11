import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { AppointmentDetailSheet } from "@/components/appointments/AppointmentDetailSheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarDays, Clock, CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";
import type { Appointment } from "@/types/calendar";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }),
};

interface DoctorRecord {
  id: string;
  user_id: string;
}

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
    pending: { color: "border-[rgba(245,166,35,0.3)] bg-[#fff8e6] text-[#f5a623]", icon: AlertCircle, label: t.pending },
    confirmed: { color: "border-[#b5d1cc] bg-[#eaf5ff] text-[#4f8fe6]", icon: CheckCircle2, label: t.confirmed },
    completed: { color: "border-[#b5d1cc] bg-[#e6f4ef] text-[#65a98f]", icon: CheckCircle2, label: t.completed },
    cancelled: { color: "border-[rgba(252,165,165,0.3)] bg-[#fef2f2] text-[#e05252]", icon: XCircle, label: t.cancelled },
  };

  const { data: doctorRecord } = useQuery<DoctorRecord>({
    queryKey: ["my-doctor-record", user?.id],
    queryFn: async () => {
      const doctors = await api.doctors.list() as DoctorRecord[];
      const doctor = doctors.find((item) => item.user_id === user!.id);
      if (!doctor) throw new Error("Doctor record not found");
      return doctor;
    },
    enabled: !!user,
  });
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
    enabled: !!doctorRecord,
  });
  const updateStatus = useMutation({ mutationFn: async ({ id, status }: { id: string; status: string }) => api.appointments.updateStatus(id, status), onSuccess: () => { toast.success(t.appointmentUpdated); queryClient.invalidateQueries({ queryKey: ["doctor-appointments-list"] }); queryClient.invalidateQueries({ queryKey: ["doctor-all-appointments"] }); }, onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to update appointment") });

  const confirmed = appointments?.filter((a) => a.status === "confirmed") || [];
  const completed = appointments?.filter((a) => a.status === "completed") || [];
  const cancelled = appointments?.filter((a) => a.status === "cancelled") || [];
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
    if (!list || list.length === 0) {
      return (
        <div className="text-center py-12 text-sm" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>
          {t.noAppointmentsInCategory}
        </div>
      );
    }
    return (
      <div className="space-y-3" style={{ maxHeight: "560px", overflowY: "auto" }}>
        {list.map((apt, i) => { const patient = apt.profiles; const status = statusConfig[apt.status]; const StatusIcon = status.icon; return (
          <motion.div key={apt.id} custom={i} variants={fadeUp} initial="hidden" animate="visible">
            <Card
              className="cursor-pointer rounded-2xl border border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.08)] transition-all duration-200 hover:border-[#4f8fe6] hover:shadow-[0_8px_22px_rgba(79,143,230,0.14)]"
              onClick={() => { setDetailId(apt.id); }}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#eaf5ff" }}>
                      <span className="font-bold text-sm" style={{ color: "#4f8fe6", fontFamily: "Manrope, sans-serif" }}>
                        {patient?.full_name?.[0] || "P"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>
                        {patient?.full_name || t.patient}
                      </div>
                      <div className="flex items-center gap-3 text-sm mt-0.5" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>
                        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{format(parseISO(apt.appointment_date), "MMM d, yyyy")}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{apt.start_time.slice(0, 5)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {apt.status === "confirmed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-xs border-[#b5d1cc] text-[#65a98f] hover:bg-[#e6f4ef] hover:text-[#65a98f]"
                        style={{ fontFamily: "Inter, sans-serif" }}
                        onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: apt.id, status: "completed" }); }}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />{t.complete}
                      </Button>
                    )}
                    <Badge
                      variant="outline"
                      className={cn("shrink-0 rounded-full border px-3 py-1", status.color)}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      <StatusIcon className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">{status.label}</span>
                    </Badge>
                  </div>
                </div>
                {apt.notes && (
                  <div className="mt-3 p-2 rounded-lg text-xs flex items-start gap-2" style={{ backgroundColor: "#f4f8fd", color: "#5a7a8a" }}>
                    <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" style={{ color: "#4f8fe6" }} />
                    <span className="line-clamp-1" style={{ fontFamily: "Inter, sans-serif" }}>{apt.notes}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ); })}
      </div>
    );
  };

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6 rounded-[28px] bg-[#f4f8fd] p-1">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>
            {t.appointments}
          </h1>
          <p className="mt-2 text-sm text-[#5a7a8a]" style={{ fontFamily: "Inter, sans-serif" }}>
            {t.appointmentsDesc}
          </p>
        </motion.div>
        <Tabs defaultValue="confirmed">
          <motion.div custom={1} variants={fadeUp}>
            <TabsList className="rounded-xl mb-6 bg-white border border-[#b5d1cc] shadow-[0_2px_8px_rgba(79,143,230,0.06)]">
              <TabsTrigger value="confirmed" className="rounded-lg data-[state=active]:bg-[#eaf5ff] data-[state=active]:text-[#4f8fe6]" style={{ fontFamily: "Inter, sans-serif" }}>
                {t.confirmed} ({confirmed.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-[#e6f4ef] data-[state=active]:text-[#65a98f]" style={{ fontFamily: "Inter, sans-serif" }}>
                {t.completed} ({completed.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="rounded-lg data-[state=active]:bg-[#fef2f2] data-[state=active]:text-[#e05252]" style={{ fontFamily: "Inter, sans-serif" }}>
                {t.cancelled} ({cancelled.length})
              </TabsTrigger>
            </TabsList>
          </motion.div>
          {isLoading ? <div className="space-y-3" style={{ maxHeight: "560px", overflowY: "auto" }}>{[1, 2, 3].map((i) => <div key={i} className="rounded-2xl border border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.08)] animate-pulse h-20" />)}</div> : (<><TabsContent value="confirmed">{renderList(confirmed)}</TabsContent><TabsContent value="completed">{renderList(completed)}</TabsContent><TabsContent value="cancelled">{renderList(cancelled)}</TabsContent></>)}
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
