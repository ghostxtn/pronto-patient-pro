import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { hasActiveDoctorProfile } from "@/lib/doctor-access";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Users, Stethoscope, CalendarDays, Activity, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }),
};

export default function AdminDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();

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
        .sort((a: any, b: any) => {
          const aDate = new Date(a.created_at ?? a.appointment_date).getTime();
          const bDate = new Date(b.created_at ?? b.appointment_date).getTime();
          return bDate - aDate;
        })
        .slice(0, 8);
    },
  });
  const { data: myDoctorProfile } = useQuery({
    queryKey: ["admin-my-doctor-profile"],
    queryFn: async () => api.doctors.me(),
  });

  const statCards = [
    { label: t.totalPatients, value: stats?.patients ?? 0, icon: Users, color: "from-primary to-info", to: "/admin/patients" },
    { label: t.activeDoctors, value: stats?.doctors ?? 0, icon: Stethoscope, color: "from-secondary to-success", to: "/admin/doctors" },
    { label: t.appointments, value: stats?.appointments ?? 0, icon: CalendarDays, color: "from-warning to-destructive", to: "/admin/appointments" },
    { label: t.confirmedAppointments, value: stats?.confirmed ?? 0, icon: Clock, color: "from-info to-primary", to: "/admin/appointments?status=confirmed" },
  ];

  const statusColor: Record<string, string> = { pending: "bg-warning/15 text-warning border-warning/30", confirmed: "bg-primary/15 text-primary border-primary/30", completed: "bg-success/15 text-success border-success/30", cancelled: "bg-destructive/15 text-destructive border-destructive/30" };

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-8">
        <motion.div custom={0} variants={fadeUp}><h1 className="text-3xl font-display font-bold">{t.adminDashboard}</h1><p className="text-muted-foreground mt-1">{t.adminDashboardDesc}</p></motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div key={s.label} custom={i + 1} variants={fadeUp}><Card className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer" onClick={() => navigate(s.to)}><CardContent className="p-5"><div className="flex items-center justify-between mb-3"><div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}><s.icon className="h-5 w-5 text-primary-foreground" /></div><TrendingUp className="h-4 w-4 text-muted-foreground" /></div><div className="text-2xl font-display font-bold">{s.value}</div><div className="text-sm text-muted-foreground">{s.label}</div></CardContent></Card></motion.div>
          ))}
        </div>
        {hasActiveDoctorProfile(myDoctorProfile) && (
          <motion.div custom={5} variants={fadeUp}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  You also have an active doctor profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">You can quickly access your doctor tools from here.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => navigate("/doctor/schedule")}>Go to My Doctor Schedule</Button>
                  <Button variant="outline" onClick={() => navigate("/doctor/appointments")}>View My Doctor Appointments</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        <motion.div custom={6} variants={fadeUp}>
          <Card className="shadow-card"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-5 w-5 text-primary" />{t.recentAppointments}</CardTitle></CardHeader><CardContent>
            {!recentAppointments?.length ? <p className="text-muted-foreground text-sm py-4 text-center">{t.noAppointmentsYetAdmin}</p> : (
              <div className="space-y-3">{recentAppointments.map((apt: any) => (<div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"><div className="min-w-0"><p className="font-medium text-sm truncate">{apt.patientDisplayName || t.patient} → {apt.doctorDisplayName || t.doctor}</p><p className="text-xs text-muted-foreground">{format(new Date(apt.appointment_date), "MMM d, yyyy")} · {apt.start_time?.slice(0, 5)}</p></div><Badge variant="outline" className={statusColor[apt.status] ?? ""}>{apt.status}</Badge></div>))}</div>
            )}
          </CardContent></Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
