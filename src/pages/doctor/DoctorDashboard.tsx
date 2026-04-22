import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { format, parseISO, isToday } from "date-fns";
import { CalendarCheck, Clock, Users, Activity, ArrowRight, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }),
};

const statusColors: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
  confirmed: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200",
};

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { data: doctorRecord } = useQuery({
    queryKey: ["my-doctor-record", user?.id],
    queryFn: async () => {
      const doctors = await api.doctors.list();
      const doctor = doctors.find((item: any) => item.user_id === user!.id);
      if (!doctor) throw new Error("Doctor record not found");
      return doctor;
    },
    enabled: !!user,
  });
  const { data: appointments } = useQuery({
    queryKey: ["doctor-all-appointments", doctorRecord?.id],
    queryFn: async () => {
      const data = await api.appointments.list({ doctorId: doctorRecord!.id });
      return data.map((appointment: any) => ({
        ...appointment,
        profiles:
          appointment.profiles ??
          appointment.profile ??
          appointment.patient ??
          null,
      }));
    },
    enabled: !!doctorRecord,
  });

  const todayAppts = appointments?.filter((a) => isToday(parseISO(a.appointment_date)) && a.status !== "cancelled") || [];
  const pending = appointments?.filter((a) => a.status === "pending") || [];
  const confirmed = appointments?.filter((a) => a.status === "confirmed") || [];
  const total = appointments?.length || 0;

  const stats = [
    {
      icon: CalendarCheck,
      label: t.today,
      value: String(todayAppts.length),
      iconBg: "#eaf5ff",
      iconColor: "#4f8fe6",
      onClick: () => navigate("/doctor/schedule", { state: { view: "day" } }),
    },
    {
      icon: AlertCircle,
      label: t.pending,
      value: String(pending.length),
      iconBg: "#fff8e6",
      iconColor: "#f5a623",
      onClick: () => navigate("/doctor/appointments?status=pending"),
    },
    {
      icon: CheckCircle2,
      label: t.confirmed,
      value: String(confirmed.length),
      iconBg: "#e6f4ef",
      iconColor: "#65a98f",
      onClick: () => navigate("/doctor/appointments?status=confirmed"),
    },
    {
      icon: Activity,
      label: t.total,
      value: String(total),
      iconBg: "#eaf5ff",
      iconColor: "#2f75ca",
      onClick: () => navigate("/doctor/appointments"),
    },
  ];

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-8 rounded-[28px] bg-background/40 p-1">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
            {t.doctorDashboard}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
            {t.doctorDashboardDesc}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} custom={i + 2} variants={fadeUp}>
              <Card
                className="cursor-pointer rounded-2xl border border-border bg-card shadow-soft transition-all duration-200 hover:border-primary/60 hover:shadow-elevated"
                onClick={stat.onClick}
              >
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: stat.iconBg }}>
                      <stat.icon className="h-5 w-5" style={{ color: stat.iconColor }} />
                    </div>
                    <TrendingUp className="h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-300" />
                  </div>
                  <div className="text-[2rem] font-bold leading-none text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
                    {stat.value}
                  </div>
                  <div className="mt-3 text-[0.85rem] text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div custom={6} variants={fadeUp}>
          <Card className="rounded-2xl border border-border bg-card shadow-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
                <CalendarCheck className="h-5 w-5 text-primary" />
                {t.todaysSchedule}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/doctor/appointments">{t.viewAll} <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
            </CardHeader>
            <CardContent>
              {todayAppts.length > 0 ? (
                <div className="space-y-3">
                  {todayAppts.map((apt) => { const patient = apt.profiles as any; return (
                    <div key={apt.id} className="flex items-center justify-between rounded-xl bg-background/70 p-4 transition-colors hover:bg-accent/60">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <span className="text-sm font-bold text-primary" style={{ fontFamily: "Manrope, sans-serif" }}>
                            {patient?.full_name?.[0] || "P"}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                            {patient?.full_name || t.patient}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                            <Clock className="h-3 w-3" />
                            {apt.start_time.slice(0, 5)} - {apt.end_time.slice(0, 5)}
                          </div>
                        </div>
                      </div>
                      <Badge
                        className={cn("shrink-0 rounded-full border px-3 py-1", statusColors[apt.status] ?? "")}
                        variant="outline"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {apt.status}
                      </Badge>
                    </div>
                  ); })}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                  {t.noTodayAppointments}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="grid md:grid-cols-2 gap-4" custom={7} variants={fadeUp}>
          <Link to="/doctor/schedule">
            <Card className="group cursor-pointer rounded-2xl border border-border bg-card shadow-soft transition-all duration-200 hover:border-primary/60 hover:shadow-elevated">
              <CardContent className="p-6">
                <Clock className="mb-3 h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                <h3 className="mb-1 font-semibold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>{t.manageSchedule}</h3>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>{t.manageScheduleDesc}</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/doctor/appointments">
            <Card className="group cursor-pointer rounded-2xl border border-border bg-card shadow-soft transition-all duration-200 hover:border-primary/60 hover:shadow-elevated">
              <CardContent className="p-6">
                <CalendarCheck className="mb-3 h-8 w-8 text-emerald-600 transition-transform group-hover:scale-110 dark:text-emerald-400" />
                <h3 className="mb-1 font-semibold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>{t.viewAppointments}</h3>
                <p className="text-sm text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>{t.viewAppointmentsDesc}</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
