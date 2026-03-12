import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { format, parseISO, isToday } from "date-fns";
import { CalendarCheck, Clock, Users, Activity, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }),
};

const statusColors: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-success/10 text-success border-success/20",
  completed: "bg-primary/10 text-primary border-primary/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function DoctorDashboard() {
  const { user, loading, hasRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
    if (!loading && user && !hasRole("doctor")) navigate("/dashboard");
  }, [user, loading, hasRole, navigate]);

  const { data: doctorRecord } = useQuery({ queryKey: ["my-doctor-record", user?.id], queryFn: async () => { const { data, error } = await supabase.from("doctors").select("id").eq("user_id", user!.id).single(); if (error) throw error; return data; }, enabled: !!user });
  const { data: appointments } = useQuery({ queryKey: ["doctor-all-appointments", doctorRecord?.id], queryFn: async () => { const { data, error } = await supabase.from("appointments").select(`*, profiles!appointments_patient_profile_fkey (full_name, avatar_url, email)`).eq("doctor_id", doctorRecord!.id).order("appointment_date", { ascending: true }); if (error) throw error; return data; }, enabled: !!doctorRecord });

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>;

  const todayAppts = appointments?.filter((a) => isToday(parseISO(a.appointment_date)) && a.status !== "cancelled") || [];
  const pending = appointments?.filter((a) => a.status === "pending") || [];
  const confirmed = appointments?.filter((a) => a.status === "confirmed") || [];
  const total = appointments?.length || 0;

  const stats = [
    { icon: CalendarCheck, label: t.today, value: String(todayAppts.length), color: "from-primary to-info" },
    { icon: AlertCircle, label: t.pending, value: String(pending.length), color: "from-warning to-destructive" },
    { icon: CheckCircle2, label: t.confirmed, value: String(confirmed.length), color: "from-secondary to-success" },
    { icon: Activity, label: t.total, value: String(total), color: "from-accent-foreground to-primary" },
  ];

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible">
        <motion.h1 className="text-3xl font-display font-bold mb-2" custom={0} variants={fadeUp}>{t.doctorDashboard}</motion.h1>
        <motion.p className="text-muted-foreground mb-8" custom={1} variants={fadeUp}>{t.doctorDashboardDesc}</motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} className="glass rounded-2xl p-5 shadow-card" custom={i + 2} variants={fadeUp}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}><stat.icon className="h-5 w-5 text-primary-foreground" /></div>
              <div className="text-2xl font-display font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div className="glass rounded-2xl p-6 shadow-card mb-6" custom={6} variants={fadeUp}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">{t.todaysSchedule}</h3>
            <Button variant="ghost" size="sm" asChild><Link to="/doctor/appointments">{t.viewAll} <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
          </div>
          {todayAppts.length > 0 ? (
            <div className="space-y-3">
              {todayAppts.map((apt) => { const patient = apt.profiles as any; return (
                <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-secondary to-success flex items-center justify-center flex-shrink-0"><span className="text-secondary-foreground font-display font-bold text-sm">{patient?.full_name?.[0] || "P"}</span></div>
                    <div><div className="font-medium text-sm">{patient?.full_name || t.patient}</div><div className="text-xs text-muted-foreground flex items-center gap-2"><Clock className="h-3 w-3" />{apt.start_time.slice(0, 5)} — {apt.end_time.slice(0, 5)}</div></div>
                  </div>
                  <Badge className={cn("rounded-full border", statusColors[apt.status])} variant="outline">{apt.status}</Badge>
                </div>
              ); })}
            </div>
          ) : <div className="text-center py-8 text-muted-foreground text-sm">{t.noTodayAppointments}</div>}
        </motion.div>

        <motion.div className="grid md:grid-cols-2 gap-4" custom={7} variants={fadeUp}>
          <Link to="/doctor/schedule" className="glass rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all group">
            <Clock className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-display font-semibold mb-1">{t.manageSchedule}</h3>
            <p className="text-sm text-muted-foreground">{t.manageScheduleDesc}</p>
          </Link>
          <Link to="/doctor/appointments" className="glass rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all group">
            <CalendarCheck className="h-8 w-8 text-secondary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-display font-semibold mb-1">{t.viewAppointments}</h3>
            <p className="text-sm text-muted-foreground">{t.viewAppointmentsDesc}</p>
          </Link>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
