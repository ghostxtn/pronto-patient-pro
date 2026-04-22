import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, ArrowRight, CalendarCheck, Clock, Users } from "lucide-react";
import { parseISO } from "date-fns";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/services/api";
import { cn } from "@/lib/utils";
import { formatLocalizedDateFns } from "@/lib/date-localization";
import { getAppointmentStatusLabel, normalizeAppointmentStatus } from "@/lib/status-localization";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  const { data: appointments } = useQuery({
    queryKey: ["dashboard-appointments", user?.id],
    queryFn: async () => api.appointments.list(),
    enabled: !!user,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const upcoming = appointments?.filter((a) => a.status === "pending" || a.status === "confirmed") || [];
  const pending = appointments?.filter((a) => a.status === "pending") || [];
  const completed = appointments?.filter((a) => a.status === "completed") || [];
  const total = appointments?.length || 0;

  const quickStats = [
    { icon: CalendarCheck, label: t.upcoming, value: String(upcoming.length), iconWrap: "bg-primary/10 text-primary" },
    { icon: Clock, label: t.pending, value: String(pending.length), iconWrap: "bg-amber-500/12 text-amber-700 dark:text-amber-300" },
    { icon: Users, label: t.completed, value: String(completed.length), iconWrap: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" },
    { icon: Activity, label: t.total, value: String(total), iconWrap: "bg-sky-500/12 text-sky-700 dark:text-sky-300" },
  ];

  const getStatusClasses = (status: string) => {
    switch (normalizeAppointmentStatus(status)) {
      case "confirmed":
        return "bg-primary/10 text-primary";
      case "pending":
        return "bg-amber-500/12 text-amber-700 dark:text-amber-300";
      case "completed":
        return "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300";
      default:
        return "bg-destructive/10 text-destructive";
    }
  };

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible">
        <motion.h1 className="mb-2 text-3xl font-display font-bold text-foreground" custom={0} variants={fadeUp}>
          {t.welcomeBackUser}
          {user?.name ? `, ${user.name}` : ""}!
        </motion.h1>
        <motion.p className="mb-8 text-muted-foreground" custom={1} variants={fadeUp}>
          {t.dashboardDesc}
        </motion.p>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {quickStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i + 2}
              variants={fadeUp}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className={cn("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", stat.iconWrap)}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-display font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {upcoming.length > 0 ? (
          <motion.div custom={6} variants={fadeUp} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold text-foreground">{t.upcomingAppointments}</h3>
              <Button variant="ghost" size="sm" asChild className="text-primary">
                <Link to="/patient/appointments">
                  {t.viewAll}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((apt) => {
                const doc = apt.doctor as any;
                return (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 p-3 transition-colors hover:bg-muted/70"
                  >
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        Dr. {[doc?.firstName, doc?.lastName].filter(Boolean).join(" ")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatLocalizedDateFns(parseISO(apt.appointment_date), "MMM d", lang)} · {apt.start_time.slice(0, 5)}
                      </div>
                    </div>
                    <span className={cn("rounded-full px-2.5 py-1 text-[0.72rem] font-semibold", getStatusClasses(apt.status))}>
                      {getAppointmentStatusLabel(apt.status, t)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div custom={6} variants={fadeUp} className="rounded-2xl border border-border bg-card px-8 py-10 text-center shadow-sm">
            <CalendarCheck className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-display font-semibold text-foreground">{t.noAppointmentsYet}</h3>
            <p className="mb-4 text-sm text-muted-foreground">{t.noAppointmentsDesc}</p>
            <Button className="rounded-full px-6" asChild>
              <Link to="/patient/doctors">{t.findDoctor}</Link>
            </Button>
          </motion.div>
        )}
      </motion.div>
    </AppLayout>
  );
}
