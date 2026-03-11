import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Users, Stethoscope, CalendarDays, Activity, TrendingUp, Clock } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [patients, doctors, appointments, pending] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("doctors").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return {
        patients: patients.count ?? 0,
        doctors: doctors.count ?? 0,
        appointments: appointments.count ?? 0,
        pending: pending.count ?? 0,
      };
    },
  });

  const { data: recentAppointments } = useQuery({
    queryKey: ["admin-recent-appointments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*, doctors(id, user_id, profiles:user_id(full_name)), profiles!appointments_patient_profile_fkey(full_name)")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const statCards = [
    { label: "Total Patients", value: stats?.patients ?? 0, icon: Users, color: "from-primary to-info" },
    { label: "Active Doctors", value: stats?.doctors ?? 0, icon: Stethoscope, color: "from-secondary to-success" },
    { label: "Appointments", value: stats?.appointments ?? 0, icon: CalendarDays, color: "from-warning to-destructive" },
    { label: "Pending Review", value: stats?.pending ?? 0, icon: Clock, color: "from-info to-primary" },
  ];

  const statusColor: Record<string, string> = {
    pending: "bg-warning/15 text-warning border-warning/30",
    confirmed: "bg-primary/15 text-primary border-primary/30",
    completed: "bg-success/15 text-success border-success/30",
    cancelled: "bg-destructive/15 text-destructive border-destructive/30",
  };

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-8">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your clinic operations.</p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div key={s.label} custom={i + 1} variants={fadeUp}>
              <Card className="shadow-card hover:shadow-elevated transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                      <s.icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-display font-bold">{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div custom={5} variants={fadeUp}>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                Recent Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!recentAppointments?.length ? (
                <p className="text-muted-foreground text-sm py-4 text-center">No appointments yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentAppointments.map((apt: any) => (
                    <div key={apt.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {apt.profiles?.full_name || "Patient"} → Dr. {apt.doctors?.profiles?.full_name || "Doctor"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(apt.appointment_date), "MMM d, yyyy")} · {apt.start_time?.slice(0, 5)}
                        </p>
                      </div>
                      <Badge variant="outline" className={statusColor[apt.status] ?? ""}>
                        {apt.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
