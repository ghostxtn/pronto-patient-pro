import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { enUS, tr as trLocale } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Clock3, Stethoscope, TrendingUp, Users } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function getPatientName(appointment: any, fallback: string) {
  return `${appointment.patient?.firstName ?? ""} ${appointment.patient?.lastName ?? ""}`.trim() || fallback;
}

function getDoctorName(appointment: any, fallback: string) {
  return `${appointment.doctor?.firstName ?? ""} ${appointment.doctor?.lastName ?? ""}`.trim() || fallback;
}

function getDoctorDisplayName(doctor: any, fallback: string) {
  const fullName = `${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim();
  return fullName || doctor.email || fallback;
}

export default function StaffDashboard() {
  const { lang, t } = useLanguage();
  const locale = lang === "tr" ? trLocale : enUS;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const todayDayOfWeek = new Date().getDay();

  const { data, isLoading } = useQuery({
    queryKey: ["staff-dashboard", today],
    queryFn: async () => {
      const [pendingAppointments, todayAppointments, patients, doctors] = await Promise.all([
        api.appointments.list({ status: "pending" }),
        api.appointments.list({ date_from: today, date_to: today }),
        api.patients.list({ limit: 0 }),
        api.doctors.list(),
      ]);

      const patientList = Array.isArray(patients) ? patients : (patients.data ?? []);
      const doctorAvailability = await Promise.all(
        doctors.map(async (doctor: any) => {
          const slots = await api.availability.listByDoctor(doctor.id);
          const todaySlots = slots.filter(
            (slot: any) =>
              slot.is_active !== false &&
              (slot.specific_date === today ||
                (!slot.specific_date && slot.day_of_week === todayDayOfWeek)),
          );

          return {
            id: doctor.id,
            name: getDoctorDisplayName(doctor, t.doctor),
            todaySlotCount: todaySlots.length,
            isAvailableToday: todaySlots.length > 0,
          };
        }),
      );

      return {
        pendingAppointments,
        todayAppointments,
        totalPatients: Array.isArray(patients) ? patients.length : (patients.total ?? patientList.length ?? 0),
        totalDoctors: doctors.length ?? 0,
        doctorAvailability,
      };
    },
  });

  const confirmAppointment = useMutation({
    mutationFn: async (appointmentId: string) => api.appointments.updateStatus(appointmentId, "confirmed"),
    onSuccess: async () => {
      toast.success(t.appointmentApproved);
      await queryClient.invalidateQueries({ queryKey: ["staff-dashboard"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t.appointmentApproveFailed);
    },
  });

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: t.pending, color: "border-[rgba(245,166,35,0.3)] bg-[#fff8e6] text-[#f5a623]" },
    confirmed: { label: t.confirmed, color: "border-[#b5d1cc] bg-[#eaf5ff] text-[#4f8fe6]" },
    completed: { label: t.completed, color: "border-[#b5d1cc] bg-[#e6f4ef] text-[#65a98f]" },
    cancelled: { label: t.cancelled, color: "border-[rgba(252,165,165,0.3)] bg-[#fef2f2] text-[#e05252]" },
  };

  const statCards = [
    {
      label: t.todaysAppointments,
      value: data?.todayAppointments.filter((appointment: any) => appointment.status !== "cancelled").length ?? 0,
      icon: CalendarDays,
      iconBg: "#eaf5ff",
      iconColor: "#4f8fe6",
      to: "/admin/appointments",
    },
    {
      label: t.pendingApprovals,
      value: data?.pendingAppointments.length ?? 0,
      icon: Clock3,
      iconBg: "#fff8e6",
      iconColor: "#f5a623",
      to: "/admin/appointments",
    },
    {
      label: t.totalPatientsStat,
      value: data?.totalPatients ?? 0,
      icon: Users,
      iconBg: "#e6f4ef",
      iconColor: "#65a98f",
      to: "/admin/patients",
    },
    {
      label: t.activeDoctorsStat,
      value: data?.totalDoctors ?? 0,
      icon: Stethoscope,
      iconBg: "#eaf5ff",
      iconColor: "#2f75ca",
      to: "/staff/doctors",
    },
  ];

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-8 rounded-[28px] bg-[#f4f8fd] p-1">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>
            {t.staffDashboard}
          </h1>
          <p className="mt-2 text-sm text-[#5a7a8a]" style={{ fontFamily: "Inter, sans-serif" }}>
            {t.staffDashboardDesc}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((card, index) => (
            <motion.div key={card.label} custom={index + 1} variants={fadeUp}>
              <Card
                className="cursor-pointer rounded-2xl border border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.08)] transition-all duration-200 hover:border-[#4f8fe6] hover:shadow-[0_8px_22px_rgba(79,143,230,0.14)]"
                onClick={() => navigate(card.to)}
              >
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: card.iconBg }}>
                      <card.icon className="h-5 w-5" style={{ color: card.iconColor }} />
                    </div>
                    <TrendingUp className="h-4 w-4 shrink-0 text-[#65a98f]" />
                  </div>
                  <div className="text-[2rem] font-bold leading-none text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>
                    {isLoading ? "..." : card.value}
                  </div>
                  <div className="mt-3 text-[0.85rem] text-[#5a7a8a]" style={{ fontFamily: "Inter, sans-serif" }}>
                    {card.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <motion.div custom={5} variants={fadeUp}>
            <Card className="rounded-2xl border border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.08)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>
                  <CheckCircle2 className="h-5 w-5" style={{ color: "#4f8fe6" }} />
                  {t.pendingApprovals}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl" style={{ backgroundColor: "#eaf5ff" }} />)}</div>
                ) : !data?.pendingAppointments.length ? (
                  <p className="py-6 text-center text-sm" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>{t.noPendingApprovals}</p>
                ) : (
                  <div className="space-y-3">
                    {data.pendingAppointments.map((appointment: any) => (
                      <div key={appointment.id} className="flex flex-col gap-3 rounded-xl bg-[#f4f8fd] p-4 transition-colors hover:bg-[#eaf5ff] sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#1a2e3b]" style={{ fontFamily: "Inter, sans-serif" }}>{getPatientName(appointment, t.patient)}</p>
                          <p className="text-sm font-medium text-[#1a2e3b]" style={{ fontFamily: "Inter, sans-serif" }}>{getDoctorName(appointment, t.doctor)}</p>
                          <p className="text-xs" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>
                            {format(new Date(appointment.appointment_date), "dd.MM.yyyy", { locale })} · {appointment.start_time?.slice(0, 5)} - {appointment.end_time?.slice(0, 5)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="rounded-full text-white"
                          style={{ backgroundColor: "#4f8fe6", fontFamily: "Inter, sans-serif" }}
                          disabled={confirmAppointment.isPending}
                          onClick={() => confirmAppointment.mutate(appointment.id)}
                        >
                          {t.approve}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={6} variants={fadeUp}>
            <Card className="rounded-2xl border border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.08)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>
                  <CalendarDays className="h-5 w-5" style={{ color: "#4f8fe6" }} />
                  {t.todaysAppointments}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl" style={{ backgroundColor: "#eaf5ff" }} />)}</div>
                ) : !data?.todayAppointments.length ? (
                  <p className="py-6 text-center text-sm" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>{t.noAppointmentsToday}</p>
                ) : (
                  <div className="space-y-3">
                    {data.todayAppointments.map((appointment: any) => {
                      const status = statusConfig[appointment.status] ?? statusConfig.pending;
                      return (
                        <div key={appointment.id} className="flex flex-col gap-3 rounded-xl bg-[#f4f8fd] p-4 transition-colors hover:bg-[#eaf5ff] sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#1a2e3b]" style={{ fontFamily: "Inter, sans-serif" }}>{appointment.start_time?.slice(0, 5)} - {appointment.end_time?.slice(0, 5)}</p>
                            <p className="truncate text-sm font-medium text-[#1a2e3b]" style={{ fontFamily: "Inter, sans-serif" }}>{getPatientName(appointment, t.patient)}</p>
                            <p className="text-xs" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>{getDoctorName(appointment, t.doctor)}</p>
                          </div>
                          <Badge variant="outline" className={cn("rounded-full border px-3 py-1", status.color)} style={{ fontFamily: "Inter, sans-serif" }}>{status.label}</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div custom={7} variants={fadeUp}>
          <Card className="rounded-2xl border border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.08)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>
                <Stethoscope className="h-5 w-5" style={{ color: "#4f8fe6" }} />
                {t.doctorAvailabilitySummary}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl" style={{ backgroundColor: "#eaf5ff" }} />)}</div>
              ) : !data?.doctorAvailability.length ? (
                <p className="py-6 text-center text-sm" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>{t.noDoctorsAvailable}</p>
              ) : (
                <div className="space-y-3" style={{ maxHeight: "480px", overflowY: "auto" }}>
                  {data.doctorAvailability.map((doctor: any) => (
                    <div key={doctor.id} className="flex flex-col gap-3 rounded-xl bg-[#f4f8fd] p-4 transition-colors hover:bg-[#eaf5ff] sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#1a2e3b]" style={{ fontFamily: "Inter, sans-serif" }}>{doctor.name}</p>
                        <p className="text-xs" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>{t.todaysSlotCount.replace("{{count}}", String(doctor.todaySlotCount))}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full border px-3 py-1",
                          doctor.isAvailableToday
                            ? "border-[#b5d1cc] bg-[#e6f4ef] text-[#65a98f]"
                            : "border-[#b5d1cc] bg-[#f4f8fd] text-[#5a7a8a]",
                        )}
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {doctor.isAvailableToday ? t.available : t.notAvailable}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
