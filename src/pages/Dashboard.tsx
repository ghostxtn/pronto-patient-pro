import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
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
  const { user, loading } = useAuth();
  const { t } = useLanguage();
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
    { icon: CalendarCheck, label: t.upcoming, value: String(upcoming.length), bg: "#eaf5ff", iconColor: "#4f8fe6" },
    { icon: Clock, label: t.pending, value: String(pending.length), bg: "#fff8e6", iconColor: "#f5a623" },
    { icon: Users, label: t.completed, value: String(completed.length), bg: "#e6f4ef", iconColor: "#65a98f" },
    { icon: Activity, label: t.total, value: String(total), bg: "#eaf5ff", iconColor: "#2f75ca" },
  ];

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible">
        <motion.h1 className="text-3xl font-display font-bold mb-2" custom={0} variants={fadeUp} style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>
          {t.welcomeBackUser}{user?.name ? `, ${user.name}` : ""}! 👋
        </motion.h1>
        <motion.p className="text-muted-foreground mb-8" custom={1} variants={fadeUp} style={{ color: "#5a7a8a" }}>
          {t.dashboardDesc}
        </motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i + 2}
              variants={fadeUp}
              style={{
                background: "white",
                border: "1px solid #b5d1cc",
                borderRadius: "16px",
                padding: "20px",
                boxShadow: "0 2px 12px rgba(79,143,230,0.08)",
              }}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                background: stat.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "12px",
              }}>
                <stat.icon style={{ width: 20, height: 20, color: stat.iconColor }} />
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "Manrope, sans-serif", color: "#1a2e3b" }}>{stat.value}</div>
              <div style={{ fontSize: "0.85rem", color: "#5a7a8a" }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {upcoming.length > 0 ? (
          <motion.div custom={6} variants={fadeUp} style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(79,143,230,0.08)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg" style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>{t.upcomingAppointments}</h3>
              <Button variant="ghost" size="sm" asChild style={{ color: "#4f8fe6", fontSize: "0.85rem" }}>
                <Link to="/patient/appointments">{t.viewAll} <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((apt) => {
                const doc = apt.doctor as any;
                return (
                  <div
                    key={apt.id}
                    style={{ background: "#f4f8fd", borderRadius: "12px", padding: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#eaf5ff"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#f4f8fd"}
                  >
                    <div>
                      <div className="font-medium text-sm" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.875rem" }}>Dr. {[doc?.firstName, doc?.lastName].filter(Boolean).join(" ")}</div>
                      <div className="text-xs text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.75rem" }}>
                        {format(parseISO(apt.appointment_date), "MMM d")} at {apt.start_time.slice(0, 5)}
                      </div>
                    </div>
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background: apt.status === "confirmed" ? "#eaf5ff"
                        : apt.status === "pending" ? "#fff8e6"
                        : apt.status === "completed" ? "#e6f4ef"
                        : "#fef2f2",
                      color: apt.status === "confirmed" ? "#4f8fe6"
                        : apt.status === "pending" ? "#f5a623"
                        : apt.status === "completed" ? "#65a98f"
                        : "#e05252",
                    }}>
                      {apt.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div custom={6} variants={fadeUp} style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", padding: "32px", textAlign: "center", boxShadow: "0 2px 12px rgba(79,143,230,0.08)" }}>
            <CalendarCheck className="h-12 w-12 mx-auto mb-4" style={{ color: "#b5d1cc" }} />
            <h3 className="font-display font-semibold text-lg mb-2" style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 600 }}>{t.noAppointmentsYet}</h3>
            <p className="text-muted-foreground text-sm mb-4" style={{ color: "#5a7a8a", fontSize: "0.875rem" }}>{t.noAppointmentsDesc}</p>
            <Button className="rounded-full px-6 shadow-soft" asChild style={{ background: "#4f8fe6", color: "white", borderRadius: "999px", padding: "8px 24px", fontWeight: 600 }}>
              <Link to="/patient/doctors">{t.findDoctor}</Link>
            </Button>
          </motion.div>
        )}
      </motion.div>
    </AppLayout>
  );
}
