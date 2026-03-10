import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Stethoscope, LogOut, CalendarCheck, Clock, Users, Activity } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Dashboard() {
  const { user, loading, roles, signOut, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const roleLabel = hasRole("admin") ? "Admin" : hasRole("doctor") ? "Doctor" : "Patient";

  const quickStats = [
    { icon: CalendarCheck, label: "Upcoming", value: "0", color: "from-primary to-info" },
    { icon: Clock, label: "Pending", value: "0", color: "from-warning to-destructive" },
    { icon: Users, label: "Completed", value: "0", color: "from-secondary to-success" },
    { icon: Activity, label: "Total", value: "0", color: "from-accent-foreground to-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="glass-strong border-b sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-display font-bold text-lg">MediBook</span>
              <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                {roleLabel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <motion.div initial="hidden" animate="visible">
          <motion.h1 className="text-3xl font-display font-bold mb-2" custom={0} variants={fadeUp}>
            Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}! 👋
          </motion.h1>
          <motion.p className="text-muted-foreground mb-8" custom={1} variants={fadeUp}>
            Here's your health dashboard overview.
          </motion.p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {quickStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="glass rounded-2xl p-5 shadow-card"
                custom={i + 2} variants={fadeUp}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="text-2xl font-display font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          <motion.div className="glass rounded-2xl p-8 shadow-card text-center" custom={6} variants={fadeUp}>
            <CalendarCheck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">No Appointments Yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {hasRole("patient")
                ? "Book your first appointment with one of our specialists."
                : "Your upcoming appointments will appear here."}
            </p>
            {hasRole("patient") && (
              <Button className="rounded-full px-6 shadow-soft">
                Find a Doctor
              </Button>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
