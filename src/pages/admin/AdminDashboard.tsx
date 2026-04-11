import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { enUS, tr as trLocale } from "date-fns/locale";
import { Users, Stethoscope, CalendarDays, Activity, TrendingUp, Clock } from "lucide-react";
import api from "@/services/api";
import { hasActiveDoctorProfile } from "@/lib/doctor-access";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function AdminDashboard() {
  const { lang, t } = useLanguage();
  const locale = lang === "tr" ? trLocale : enUS;
  const navigate = useNavigate();
  const [appointmentSearch, setAppointmentSearch] = useState("");

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [patients, doctors, appointments] = await Promise.all([
        api.patients.list({ limit: 0 }),
        api.doctors.list(),
        api.appointments.list(),
      ]);
      const patientList = Array.isArray(patients) ? patients : (patients.data ?? []);
      return {
        patients: Array.isArray(patients) ? patients.length : (patients.total ?? patientList.length ?? 0),
        doctors: doctors.filter((doctor: any) => doctor.is_active === true).length ?? 0,
        appointments: appointments.length ?? 0,
        confirmed: appointments.filter((appointment: any) => appointment.status === "confirmed").length,
      };
    },
  });

  const { data: recentAppointments } = useQuery({
    queryKey: ["admin-recent-appointments"],
    queryFn: async () => {
      const data = await api.appointments.list();
      return data
        .map((appointment: any) => ({
          ...appointment,
          patientDisplayName: `${appointment.patient?.firstName ?? ""} ${appointment.patient?.lastName ?? ""}`.trim(),
          doctorDisplayName: `${appointment.doctor?.title ?? ""} ${appointment.doctor?.firstName ?? ""} ${appointment.doctor?.lastName ?? ""}`.trim(),
        }))
        .sort((a: any, b: any) =>
          new Date(b.created_at ?? b.appointment_date).getTime() -
          new Date(a.created_at ?? a.appointment_date).getTime(),
        );
    },
  });

  const filteredAppointments = (recentAppointments ?? []).filter((apt: any) => {
    if (!appointmentSearch.trim()) return true;
    const q = appointmentSearch.toLowerCase();
    return (
      apt.patientDisplayName?.toLowerCase().includes(q) ||
      apt.doctorDisplayName?.toLowerCase().includes(q)
    );
  });

  const { data: myDoctorProfile } = useQuery({
    queryKey: ["admin-my-doctor-profile"],
    queryFn: async () => api.doctors.me(),
  });

  const statCards = [
    { label: t.totalPatients, value: stats?.patients ?? 0, icon: Users, iconBg: "#eaf5ff", iconColor: "#4f8fe6", to: "/admin/patients" },
    { label: t.activeDoctors, value: stats?.doctors ?? 0, icon: Stethoscope, iconBg: "#e6f4ef", iconColor: "#65a98f", to: "/admin/doctors" },
    { label: t.appointments, value: stats?.appointments ?? 0, icon: CalendarDays, iconBg: "#fff8e6", iconColor: "#f5a623", to: "/admin/appointments" },
    { label: t.confirmedAppointments, value: stats?.confirmed ?? 0, icon: Clock, iconBg: "#eaf5ff", iconColor: "#2f75ca", to: "/admin/appointments?status=confirmed" },
  ];

  const statusLabels: Record<string, string> = {
    pending: t.pending,
    confirmed: t.confirmed,
    completed: t.completed,
    cancelled: t.cancelled,
  };

  const statusColor: Record<string, string> = {
    pending: "border-[rgba(245,166,35,0.3)] bg-[#fff8e6] text-[#f5a623]",
    confirmed: "border-[#b5d1cc] bg-[#eaf5ff] text-[#4f8fe6]",
    completed: "border-[#b5d1cc] bg-[#e6f4ef] text-[#65a98f]",
    cancelled: "border-[rgba(252,165,165,0.3)] bg-[#fef2f2] text-[#e05252]",
  };

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-8 rounded-[28px] bg-[#f4f8fd] p-1">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>
            {t.adminDashboard}
          </h1>
          <p className="mt-2 text-sm text-[#5a7a8a]" style={{ fontFamily: "Inter, sans-serif" }}>
            {t.adminDashboardDesc}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((s, i) => (
            <motion.div key={s.label} custom={i + 1} variants={fadeUp}>
              <Card
                className="cursor-pointer rounded-2xl border border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.08)] transition-all duration-200 hover:border-[#4f8fe6] hover:shadow-[0_8px_22px_rgba(79,143,230,0.14)]"
                onClick={() => navigate(s.to)}
              >
                <CardContent className="p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: s.iconBg }}>
                      <s.icon className="h-5 w-5" style={{ color: s.iconColor }} />
                    </div>
                    <TrendingUp className="h-4 w-4 shrink-0 text-[#65a98f]" />
                  </div>
                  <div className="text-[2rem] font-bold leading-none text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>
                    {s.value}
                  </div>
                  <div className="mt-3 text-[0.85rem] text-[#5a7a8a]" style={{ fontFamily: "Inter, sans-serif" }}>
                    {s.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {hasActiveDoctorProfile(myDoctorProfile) ? (
          <motion.div custom={5} variants={fadeUp}>
            <Card className="rounded-2xl border border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.08)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>
                  <Stethoscope className="h-5 w-5 text-[#4f8fe6]" />
                  {t.activeDoctorProfileTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[#5a7a8a]" style={{ fontFamily: "Inter, sans-serif" }}>
                  {t.activeDoctorProfileDesc}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button className="rounded-[10px] border border-[#4f8fe6] bg-[#4f8fe6] text-white hover:bg-[#2f75ca]" style={{ fontFamily: "Inter, sans-serif" }} onClick={() => navigate("/doctor/schedule")}>
                    {t.goToDoctorSchedule}
                  </Button>
                  <Button variant="outline" className="rounded-[10px] border-[#b5d1cc] bg-white text-[#4f8fe6] hover:bg-[#eaf5ff] hover:text-[#2f75ca]" style={{ fontFamily: "Inter, sans-serif" }} onClick={() => navigate("/doctor/appointments")}>
                    {t.viewDoctorAppointments}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}

        <motion.div custom={6} variants={fadeUp}>
          <Card className="rounded-2xl border border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.08)]">
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>
                <Activity className="h-5 w-5 text-[#4f8fe6]" />
                {t.recentAppointments}
              </CardTitle>
              <input
                type="text"
                placeholder="Hasta veya doktor ara..."
                value={appointmentSearch}
                onChange={(e) => setAppointmentSearch(e.target.value)}
                className="h-8 w-56 rounded-lg border border-[#b5d1cc] bg-[#f4f8fd] px-3 text-sm text-[#1a2e3b] placeholder:text-[#5a7a8a] focus:outline-none focus:ring-2 focus:ring-[#4f8fe6]/30"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
            </CardHeader>
            <CardContent>
              <div className="max-h-[480px] overflow-y-auto pr-1">
                {!filteredAppointments.length ? (
                  <p className="py-4 text-center text-sm text-[#5a7a8a]" style={{ fontFamily: "Inter, sans-serif" }}>
                    {appointmentSearch ? "Sonuç bulunamadı." : t.noAppointmentsYetAdmin}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {filteredAppointments.map((apt: any) => (
                      <div key={apt.id} className="flex items-center justify-between gap-3 rounded-xl border border-transparent bg-[#f4f8fd] p-4 transition-colors hover:bg-[#eaf5ff]">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#1a2e3b]" style={{ fontFamily: "Inter, sans-serif" }}>
                            {apt.patientDisplayName || t.patient} → {apt.doctorDisplayName || t.doctor}
                          </p>
                          <p className="mt-1 text-xs text-[#5a7a8a]" style={{ fontFamily: "Inter, sans-serif" }}>
                            {format(new Date(apt.appointment_date), "MMM d, yyyy", { locale })} · {apt.start_time?.slice(0, 5)}
                          </p>
                        </div>
                        <Badge variant="outline" className={`shrink-0 rounded-full border px-3 py-1 ${statusColor[apt.status] ?? ""}`} style={{ fontFamily: "Inter, sans-serif" }}>
                          {statusLabels[apt.status] ?? apt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
