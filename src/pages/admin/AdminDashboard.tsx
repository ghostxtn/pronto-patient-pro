import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [patients, doctors, appointments] = await Promise.all([
        api.patients.list({ limit: 0 }),
        api.doctors.list(),
        api.appointments.list(),
      ]);
      return {
        patients: patients.total ?? patients.data?.length ?? 0,
        doctors: doctors.length ?? 0,
        appointments: appointments.length ?? 0,
        pending: appointments.filter((appointment: any) => appointment.status === "pending").length,
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
          doctors: appointment.doctors
            ? {
                ...appointment.doctors,
                profiles:
                  appointment.doctors.profiles ??
                  appointment.doctors.profile ??
                  appointment.doctors.user ??
                  null,
              }
            : null,
          profiles:
            appointment.profiles ??
            appointment.profile ??
            appointment.patient ??
            null,
        }))
        .sort((a: any, b: any) => {
          const aDate = new Date(a.created_at ?? a.appointment_date).getTime();
          const bDate = new Date(b.created_at ?? b.appointment_date).getTime();
          return bDate - aDate;
        })
        .slice(0, 8);
    },
  });

  const statCards = [
    { label: t.totalPatients, value: stats?.patients ?? 0, icon: Users, color: "from-primary to-info" },
    { label: t.activeDoctors, value: stats?.doctors ?? 0, icon: Stethoscope, color: "from-secondary to-success" },
    { label: t.appointments, value: stats?.appointments ?? 0, icon: CalendarDays, color: "from-warning to-destructive" },
    { label: t.pendingReview, value: stats?.pending ?? 0, icon: Clock, color: "from-info to-primary" },
  ];

  const statusColor: Record<string, string> = { pending: "bg-warning/15 text-warning border-warning/30", confirmed: "bg-primary/15 text-primary border-primary/30", completed: "bg-success/15 text-success border-success/30", cancelled: "bg-destructive/15 text-destructive border-destructive/30" };

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-8">
        <motion.div custom={0} variants={fadeUp}><h1 className="text-3xl font-display font-bold">{t.adminDashboard}</h1><p className="text-muted-foreground mt-1">{t.adminDashboardDesc}</p></motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div key={s.label} custom={i + 1} variants={fadeUp}><Card className="shadow-card hover:shadow-elevated transition-shadow"><CardContent className="p-5"><div className="flex items-center justify-between mb-3"><div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}><s.icon className="h-5 w-5 text-primary-foreground" /></div><TrendingUp className="h-4 w-4 text-muted-foreground" /></div><div className="text-2xl font-display font-bold">{s.value}</div><div className="text-sm text-muted-foreground">{s.label}</div></CardContent></Card></motion.div>
          ))}
        </div>
        <motion.div custom={5} variants={fadeUp}>
          <Card className="shadow-card"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-5 w-5 text-primary" />{t.recentAppointments}</CardTitle></CardHeader><CardContent>
            {!recentAppointments?.length ? <p className="text-muted-foreground text-sm py-4 text-center">{t.noAppointmentsYetAdmin}</p> : (
              <div className="space-y-3">{recentAppointments.map((apt: any) => (<div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"><div className="min-w-0"><p className="font-medium text-sm truncate">{apt.profiles?.full_name || t.patient} → Dr. {apt.doctors?.profiles?.full_name || t.doctor}</p><p className="text-xs text-muted-foreground">{format(new Date(apt.appointment_date), "MMM d, yyyy")} · {apt.start_time?.slice(0, 5)}</p></div><Badge variant="outline" className={statusColor[apt.status] ?? ""}>{apt.status}</Badge></div>))}</div>
            )}
          </CardContent></Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
