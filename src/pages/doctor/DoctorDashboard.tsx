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
  pending: "border-[rgba(245,166,35,0.3)] bg-[#fff8e6] text-[#f5a623]",
  confirmed: "border-[#b5d1cc] bg-[#eaf5ff] text-[#4f8fe6]",
  completed: "border-[#b5d1cc] bg-[#e6f4ef] text-[#65a98f]",
  cancelled: "border-[rgba(252,165,165,0.3)] bg-[#fef2f2] text-[#e05252]",
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
      const data = await api.appointments.list({ doctor_id: doctorRecord!.id });
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
      <motion.div initial="hidden" animate="visible" className="space-y-8 rounded-[28px] bg-[#f4f8fd] p-1">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>
            {t.doctorDashboard}
          </h1>
          <p className="mt-2 text-sm text-[#5a7a8a]" style={{ fontFamily: "Inter, sans-serif" }}>
            {t.doctorDashboardDesc}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} custom={i + 2} variants={fadeUp}>
              <Card
                className="cursor-pointer rounded-2xl border border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.08)] transition-all duration-200 hover:border-[#4f8fe6] hover:shadow-[0_8px_22px_rgba(79,143,230,0.14)]"
                onClick={stat.onClick}
              >
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: stat.iconBg }}>
                      <stat.icon className="h-5 w-5" style={{ color: stat.iconColor }} />
                    </div>
                    <TrendingUp className="h-4 w-4 shrink-0 text-[#65a98f]" />
                  </div>
                  <div className="text-[2rem] font-bold leading-none text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>
                    {stat.value}
                  </div>
                  <div className="mt-3 text-[0.85rem] text-[#5a7a8a]" style={{ fontFamily: "Inter, sans-serif" }}>
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div custom={6} variants={fadeUp}>
          <Card className="rounded-2xl border border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.08)]">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>
                <CalendarCheck className="h-5 w-5 text-[#4f8fe6]" />
                {t.todaysSchedule}
              </CardTitle>
              <Button variant="ghost" size="sm" asChild><Link to="/doctor/appointments">{t.viewAll} <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
            </CardHeader>
            <CardContent>
              {todayAppts.length > 0 ? (
                <div className="space-y-3">
                  {todayAppts.map((apt) => { const patient = apt.profiles as any; return (
                    <div key={apt.id} className="flex items-center justify-between rounded-xl bg-[#f4f8fd] p-4 transition-colors hover:bg-[#eaf5ff]">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "#eaf5ff" }}>
                          <span className="text-sm font-bold" style={{ color: "#4f8fe6", fontFamily: "Manrope, sans-serif" }}>
                            {patient?.full_name?.[0] || "P"}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[#1a2e3b]" style={{ fontFamily: "Inter, sans-serif" }}>
                            {patient?.full_name || t.patient}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-[#5a7a8a]" style={{ fontFamily: "Inter, sans-serif" }}>
                            <Clock className="h-3 w-3" />
                            {apt.start_time.slice(0, 5)} — {apt.end_time.slice(0, 5)}
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
                <div className="py-8 text-center text-sm text-[#5a7a8a]" style={{ fontFamily: "Inter, sans-serif" }}>
                  {t.noTodayAppointments}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="grid md:grid-cols-2 gap-4" custom={7} variants={fadeUp}>
          <Link to="/doctor/schedule">
            <Card className="group cursor-pointer rounded-2xl border border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.08)] transition-all duration-200 hover:border-[#4f8fe6] hover:shadow-[0_8px_22px_rgba(79,143,230,0.14)]">
              <CardContent className="p-6">
                <Clock className="mb-3 h-8 w-8 group-hover:scale-110 transition-transform" style={{ color: "#4f8fe6" }} />
                <h3 className="mb-1 font-semibold text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>{t.manageSchedule}</h3>
                <p className="text-sm text-[#5a7a8a]" style={{ fontFamily: "Inter, sans-serif" }}>{t.manageScheduleDesc}</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/doctor/appointments">
            <Card className="group cursor-pointer rounded-2xl border border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.08)] transition-all duration-200 hover:border-[#4f8fe6] hover:shadow-[0_8px_22px_rgba(79,143,230,0.14)]">
              <CardContent className="p-6">
                <CalendarCheck className="mb-3 h-8 w-8 group-hover:scale-110 transition-transform" style={{ color: "#65a98f" }} />
                <h3 className="mb-1 font-semibold text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>{t.viewAppointments}</h3>
                <p className="text-sm text-[#5a7a8a]" style={{ fontFamily: "Inter, sans-serif" }}>{t.viewAppointmentsDesc}</p>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
