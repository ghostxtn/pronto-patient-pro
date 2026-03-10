import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  CalendarDays, Clock, X, Stethoscope, HeartPulse, Brain, Eye, Baby, Bone, ScanFace, Smile,
  FileText, CheckCircle2, XCircle, AlertCircle, Loader2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  stethoscope: Stethoscope, "heart-pulse": HeartPulse, brain: Brain,
  eye: Eye, baby: Baby, bone: Bone, "scan-face": ScanFace, smile: Smile,
};

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: "bg-warning/10 text-warning border-warning/20", icon: AlertCircle, label: "Pending" },
  confirmed: { color: "bg-success/10 text-success border-success/20", icon: CheckCircle2, label: "Confirmed" },
  completed: { color: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle2, label: "Completed" },
  cancelled: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle, label: "Cancelled" },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function MyAppointments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["my-appointments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          doctors (
            id, consultation_fee, experience_years,
            specializations (name, icon),
            profiles!doctors_user_id_fkey (full_name, avatar_url)
          )
        `)
        .eq("patient_id", user!.id)
        .order("appointment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status: "cancelled" as const })
        .eq("id", appointmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Appointment cancelled");
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      setDetailId(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const selectedAppointment = appointments?.find((a) => a.id === detailId);

  const upcoming = appointments?.filter((a) => a.status === "pending" || a.status === "confirmed") || [];
  const past = appointments?.filter((a) => a.status === "completed" || a.status === "cancelled") || [];

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible">
        <motion.div className="mb-8" custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold mb-2">My Appointments</h1>
          <p className="text-muted-foreground">View and manage all your appointments.</p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl p-5 shadow-card animate-pulse h-24" />
            ))}
          </div>
        ) : appointments && appointments.length > 0 ? (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <div>
                <motion.h2 className="font-display font-semibold text-lg mb-4" custom={1} variants={fadeUp}>
                  Upcoming ({upcoming.length})
                </motion.h2>
                <div className="space-y-3">
                  {upcoming.map((apt, i) => (
                    <AppointmentCard key={apt.id} appointment={apt} index={i + 2} onDetail={setDetailId} />
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <motion.h2 className="font-display font-semibold text-lg mb-4" custom={upcoming.length + 2} variants={fadeUp}>
                  Past ({past.length})
                </motion.h2>
                <div className="space-y-3">
                  {past.map((apt, i) => (
                    <AppointmentCard key={apt.id} appointment={apt} index={i + upcoming.length + 3} onDetail={setDetailId} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <motion.div className="glass rounded-2xl p-12 shadow-card text-center" custom={1} variants={fadeUp}>
            <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">No Appointments Yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Book your first appointment with one of our specialists.</p>
            <Button className="rounded-full px-6 shadow-soft" onClick={() => window.location.href = "/doctors"}>
              Find a Doctor
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          {selectedAppointment && (() => {
            const doc = selectedAppointment.doctors as any;
            const profile = doc?.profiles;
            const spec = doc?.specializations;
            const status = statusConfig[selectedAppointment.status];
            const StatusIcon = status.icon;
            const SpecIcon = iconMap[spec?.icon || ""] || Stethoscope;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display">Appointment Details</DialogTitle>
                  <DialogDescription>
                    <Badge className={cn("mt-2 rounded-full border", status.color)} variant="outline">
                      <StatusIcon className="h-3 w-3 mr-1" /> {status.label}
                    </Badge>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center">
                      <span className="text-primary-foreground font-display font-bold">
                        {profile?.full_name?.[0] || "D"}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">Dr. {profile?.full_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <SpecIcon className="h-3 w-3" /> {spec?.name}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-muted">
                      <div className="text-muted-foreground mb-1">Date</div>
                      <div className="font-medium">{format(parseISO(selectedAppointment.appointment_date), "EEE, MMM d, yyyy")}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted">
                      <div className="text-muted-foreground mb-1">Time</div>
                      <div className="font-medium">{selectedAppointment.start_time.slice(0, 5)} — {selectedAppointment.end_time.slice(0, 5)}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted">
                      <div className="text-muted-foreground mb-1">Fee</div>
                      <div className="font-medium">${doc?.consultation_fee}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted">
                      <div className="text-muted-foreground mb-1">Status</div>
                      <div className="font-medium capitalize">{selectedAppointment.status}</div>
                    </div>
                  </div>
                  {selectedAppointment.notes && (
                    <div className="p-3 rounded-xl bg-muted">
                      <div className="text-muted-foreground text-sm mb-1 flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Notes
                      </div>
                      <p className="text-sm">{selectedAppointment.notes}</p>
                    </div>
                  )}
                  {(selectedAppointment.status === "pending" || selectedAppointment.status === "confirmed") && (
                    <Button
                      variant="destructive"
                      className="w-full rounded-xl"
                      onClick={() => cancelMutation.mutate(selectedAppointment.id)}
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cancelling...</>
                      ) : (
                        <><X className="mr-2 h-4 w-4" /> Cancel Appointment</>
                      )}
                    </Button>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function AppointmentCard({
  appointment,
  index,
  onDetail,
}: {
  appointment: any;
  index: number;
  onDetail: (id: string) => void;
}) {
  const doc = appointment.doctors as any;
  const profile = doc?.profiles;
  const spec = doc?.specializations;
  const status = statusConfig[appointment.status];
  const StatusIcon = status.icon;
  const SpecIcon = iconMap[spec?.icon || ""] || Stethoscope;

  return (
    <motion.div
      className="glass rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all cursor-pointer"
      custom={index}
      variants={fadeUp}
      onClick={() => onDetail(appointment.id)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-display font-bold">
              {profile?.full_name?.[0] || "D"}
            </span>
          </div>
          <div className="min-w-0">
            <div className="font-display font-semibold truncate">Dr. {profile?.full_name}</div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <SpecIcon className="h-3 w-3" /> {spec?.name}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {format(parseISO(appointment.appointment_date), "MMM d")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {appointment.start_time.slice(0, 5)}
              </span>
            </div>
          </div>
        </div>
        <Badge className={cn("rounded-full border flex-shrink-0", status.color)} variant="outline">
          <StatusIcon className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">{status.label}</span>
        </Badge>
      </div>
    </motion.div>
  );
}
