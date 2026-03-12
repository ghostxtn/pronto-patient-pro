import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Clock, Users, Activity, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Dashboard() {
  const { user, loading, hasRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const { data: appointments } = useQuery({
    queryKey: ["dashboard-appointments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
  .from("appointments")
  .select(`
    *,
    doctors (
      specializations (name, icon),
      profiles!doctors_user_id_profiles_fkey (full_name)
    )
  `)
  .eq("patient_id", user!.id)
  .order("appointment_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const upcoming = appointments?.filter((a) => a.status === "pending" || a.status === "confirmed") || [];
  const pending = appointments?.filter((a) => a.status === "pending") || [];
  const completed = appointments?.filter((a) => a.status === "completed") || [];
  const total = appointments?.length || 0;

  const quickStats = [
    { icon: CalendarCheck, label: t.upcoming, value: String(upcoming.length), color: "from-primary to-info" },
    { icon: Clock, label: t.pending, value: String(pending.length), color: "from-warning to-destructive" },
    { icon: Users, label: t.completed, value: String(completed.length), color: "from-secondary to-success" },
    { icon: Activity, label: t.total, value: String(total), color: "from-accent-foreground to-primary" },
  ];

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible">
        <motion.h1 className="text-3xl font-display font-bold mb-2" custom={0} variants={fadeUp}>
          {t.welcomeBackUser}{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}! 👋
        </motion.h1>
        <motion.p className="text-muted-foreground mb-8" custom={1} variants={fadeUp}>
          {t.dashboardDesc}
        </motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, i) => (
            <motion.div key={stat.label} className="glass rounded-2xl p-5 shadow-card" custom={i + 2} variants={fadeUp}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="text-2xl font-display font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {upcoming.length > 0 ? (
          <motion.div className="glass rounded-2xl p-6 shadow-card" custom={6} variants={fadeUp}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg">{t.upcomingAppointments}</h3>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/appointments">{t.viewAll} <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((apt) => {
                const doc = apt.doctors as any;
                return (
                  <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                    <div>
                      <div className="font-medium text-sm">Dr. {doc?.profiles?.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {doc?.specializations?.name} • {format(parseISO(apt.appointment_date), "MMM d")} at {apt.start_time.slice(0, 5)}
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                      {apt.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div className="glass rounded-2xl p-8 shadow-card text-center" custom={6} variants={fadeUp}>
            <CalendarCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">{t.noAppointmentsYet}</h3>
            <p className="text-muted-foreground text-sm mb-4">{t.noAppointmentsDesc}</p>
            <Button className="rounded-full px-6 shadow-soft" asChild>
              <Link to="/doctors">{t.findDoctor}</Link>
            </Button>
          </motion.div>
        )}
      </motion.div>
    </AppLayout>
  );
}
