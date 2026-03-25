import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Stethoscope,
  TrendingUp,
  Users,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
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

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Bekliyor", color: "bg-warning/15 text-warning border-warning/30" },
  confirmed: { label: "Onaylandı", color: "bg-primary/15 text-primary border-primary/30" },
  completed: { label: "Tamamlandı", color: "bg-success/15 text-success border-success/30" },
  cancelled: { label: "İptal", color: "bg-destructive/15 text-destructive border-destructive/30" },
};

function getPatientName(appointment: any) {
  return `${appointment.patient?.firstName ?? ""} ${appointment.patient?.lastName ?? ""}`.trim() || "Hasta";
}

function getDoctorName(appointment: any) {
  return `${appointment.doctor?.firstName ?? ""} ${appointment.doctor?.lastName ?? ""}`.trim() || "Doktor";
}

function getDoctorDisplayName(doctor: any) {
  const fullName = `${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim();
  return fullName || doctor.email || "Doktor";
}

export default function StaffDashboard() {
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
            (slot: any) => slot.day_of_week === todayDayOfWeek && slot.is_active !== false,
          );

          return {
            id: doctor.id,
            name: getDoctorDisplayName(doctor),
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
      toast.success("Randevu onaylandı");
      await queryClient.invalidateQueries({ queryKey: ["staff-dashboard"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Randevu onaylanamadı");
    },
  });

  const statCards = [
    {
      label: "Bugünkü Randevular",
      value: data?.todayAppointments.filter((appointment: any) => appointment.status !== "cancelled").length ?? 0,
      icon: CalendarDays,
      color: "from-primary to-info",
      to: "/admin/appointments",
    },
    {
      label: "Bekleyen Onaylar",
      value: data?.pendingAppointments.length ?? 0,
      icon: Clock3,
      color: "from-warning to-destructive",
      to: "/admin/appointments",
    },
    {
      label: "Toplam Hastalar",
      value: data?.totalPatients ?? 0,
      icon: Users,
      color: "from-secondary to-success",
      to: "/admin/patients",
    },
    {
      label: "Aktif Doktorlar",
      value: data?.totalDoctors ?? 0,
      icon: Stethoscope,
      color: "from-info to-primary",
      to: "/staff/doctors",
    },
  ];

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-8">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold">Staff Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Hasta ve randevu operasyonlarini buradan hizli sekilde yonetin.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((card, index) => (
            <motion.div key={card.label} custom={index + 1} variants={fadeUp}>
              <Card className="cursor-pointer shadow-card" onClick={() => navigate(card.to)}>
                <CardContent className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${card.color}`}>
                      <card.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-display font-bold">
                    {isLoading ? "..." : card.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{card.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <motion.div custom={5} variants={fadeUp}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Bekleyen Onaylar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-20 animate-pulse rounded-xl bg-muted/40" />
                    ))}
                  </div>
                ) : !data?.pendingAppointments.length ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Bekleyen onay yok</p>
                ) : (
                  <div className="space-y-3">
                    {data.pendingAppointments.map((appointment: any) => (
                      <div
                        key={appointment.id}
                        className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4 transition-colors hover:bg-muted/60 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{getPatientName(appointment)}</p>
                          <p className="text-sm text-muted-foreground">{getDoctorName(appointment)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(appointment.appointment_date), "dd.MM.yyyy")} · {appointment.start_time?.slice(0, 5)} - {appointment.end_time?.slice(0, 5)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="rounded-full"
                          disabled={confirmAppointment.isPending}
                          onClick={() => confirmAppointment.mutate(appointment.id)}
                        >
                          Onayla
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={6} variants={fadeUp}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Bugünkü Randevular
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-20 animate-pulse rounded-xl bg-muted/40" />
                    ))}
                  </div>
                ) : !data?.todayAppointments.length ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Bugün randevu yok</p>
                ) : (
                  <div className="space-y-3">
                    {data.todayAppointments.map((appointment: any) => {
                      const status = statusConfig[appointment.status] ?? statusConfig.pending;
                      return (
                        <div
                          key={appointment.id}
                          className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4 transition-colors hover:bg-muted/60 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">{appointment.start_time?.slice(0, 5)} - {appointment.end_time?.slice(0, 5)}</p>
                            <p className="truncate text-sm">{getPatientName(appointment)}</p>
                            <p className="text-xs text-muted-foreground">{getDoctorName(appointment)}</p>
                          </div>
                          <Badge variant="outline" className={cn("rounded-full border", status.color)}>
                            {status.label}
                          </Badge>
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
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="h-5 w-5 text-primary" />
                Doktor Müsaitlik Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="h-16 animate-pulse rounded-xl bg-muted/40" />
                  ))}
                </div>
              ) : !data?.doctorAvailability.length ? (
                <p className="py-6 text-center text-sm text-muted-foreground">Doktor bulunmuyor</p>
              ) : (
                <div className="space-y-3">
                  {data.doctorAvailability.map((doctor: any) => (
                    <div
                      key={doctor.id}
                      className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4 transition-colors hover:bg-muted/60 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium">{doctor.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Bugünkü slot sayısı: {doctor.todaySlotCount}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full border",
                          doctor.isAvailableToday
                            ? "bg-success/15 text-success border-success/30"
                            : "bg-muted text-muted-foreground border-border",
                        )}
                      >
                        {doctor.isAvailableToday ? "Müsait" : "Müsait Değil"}
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
