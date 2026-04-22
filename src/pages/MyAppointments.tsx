import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, CalendarDays, CheckCircle2, Clock, FileText, Loader2, X, XCircle } from "lucide-react";
import { parseISO } from "date-fns";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/services/api";
import { formatLocalizedDateFns } from "@/lib/date-localization";
import { cn } from "@/lib/utils";
import { getAppointmentStatusLabel, normalizeAppointmentStatus } from "@/lib/status-localization";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function MyAppointments() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const queryClient = useQueryClient();
  const [detailId, setDetailId] = useState<string | null>(null);

  const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    pending: { color: "border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-300", icon: AlertCircle, label: t.pending },
    confirmed: { color: "border-primary/20 bg-primary/10 text-primary", icon: CheckCircle2, label: t.confirmed },
    completed: { color: "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300", icon: CheckCircle2, label: t.completed },
    cancelled: { color: "border-destructive/25 bg-destructive/10 text-destructive", icon: XCircle, label: t.cancelled },
  };

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["my-appointments", user?.id],
    queryFn: async () => api.appointments.list(),
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: async (appointmentId: string) => api.appointments.updateStatus(appointmentId, "cancelled"),
    onSuccess: () => {
      toast.success(t.appointmentCancelled);
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
          <h1 className="mb-2 text-3xl font-display font-bold text-foreground">{t.myAppointments}</h1>
          <p className="text-muted-foreground">{t.myAppointmentsDesc}</p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card p-5 shadow-sm" />
            ))}
          </div>
        ) : appointments && appointments.length > 0 ? (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <div>
                <motion.h2 className="mb-4 text-lg font-display font-semibold text-foreground" custom={1} variants={fadeUp}>
                  {t.upcoming} ({upcoming.length})
                </motion.h2>
                <div className="space-y-3">
                  {upcoming.map((apt, i) => {
                    const doc = apt.doctor as any;
                    const status = statusConfig[normalizeAppointmentStatus(apt.status)] ?? statusConfig.pending;
                    const StatusIcon = status.icon;

                    return (
                      <motion.div
                        key={apt.id}
                        className="cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
                        custom={i + 2}
                        variants={fadeUp}
                        onClick={() => setDetailId(apt.id)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10">
                              <span className="text-[1.1rem] font-bold text-primary">{doc?.firstName?.[0] || "D"}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-display font-semibold text-foreground">
                                Dr. {[doc?.firstName, doc?.lastName].filter(Boolean).join(" ")}
                              </div>
                              <div className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3 text-muted-foreground" />
                                  {formatLocalizedDateFns(parseISO(apt.appointment_date), "MMM d", lang)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  {apt.start_time.slice(0, 5)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge className={cn("rounded-full border flex-shrink-0", status.color)} variant="outline">
                            <StatusIcon className="mr-1 h-3 w-3" />
                            <span className="hidden sm:inline">{status.label}</span>
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <motion.h2 className="mb-4 text-lg font-display font-semibold text-foreground" custom={upcoming.length + 2} variants={fadeUp}>
                  {t.past} ({past.length})
                </motion.h2>
                <div className="space-y-3">
                  {past.map((apt, i) => {
                    const doc = apt.doctor as any;
                    const status = statusConfig[normalizeAppointmentStatus(apt.status)] ?? statusConfig.pending;
                    const StatusIcon = status.icon;

                    return (
                      <motion.div
                        key={apt.id}
                        className="cursor-pointer rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md"
                        custom={i + upcoming.length + 3}
                        variants={fadeUp}
                        onClick={() => setDetailId(apt.id)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10">
                              <span className="text-[1.1rem] font-bold text-primary">{doc?.firstName?.[0] || "D"}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-display font-semibold text-foreground">
                                Dr. {[doc?.firstName, doc?.lastName].filter(Boolean).join(" ")}
                              </div>
                              <div className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3 text-muted-foreground" />
                                  {formatLocalizedDateFns(parseISO(apt.appointment_date), "MMM d", lang)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge className={cn("rounded-full border flex-shrink-0", status.color)} variant="outline">
                            <StatusIcon className="mr-1 h-3 w-3" />
                            <span className="hidden sm:inline">{status.label}</span>
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <motion.div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm" custom={1} variants={fadeUp}>
            <CalendarDays className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="mb-2 text-lg font-display font-semibold text-foreground">{t.noAppointmentsYet}</h3>
            <p className="mb-4 text-sm text-muted-foreground">{t.noAppointmentsDesc}</p>
            <Button className="rounded-full px-6 shadow-soft" onClick={() => (window.location.href = "/patient/doctors")}>
              {t.findDoctor}
            </Button>
          </motion.div>
        )}
      </motion.div>

      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          {selectedAppointment &&
            (() => {
              const doc = selectedAppointment.doctor as any;
              const status = statusConfig[normalizeAppointmentStatus(selectedAppointment.status)] ?? statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="font-display">{t.appointmentDetails}</DialogTitle>
                    <DialogDescription>
                      <Badge className={cn("mt-2 rounded-full border", status.color)} variant="outline">
                        <StatusIcon className="mr-1 h-3 w-3" /> {status.label}
                      </Badge>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-info">
                        <span className="font-display font-bold text-primary-foreground">{doc?.firstName?.[0] || "D"}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Dr. {[doc?.firstName, doc?.lastName].filter(Boolean).join(" ")}</div>
                        <div className="text-sm text-muted-foreground">{doc?.email}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-muted p-3">
                        <div className="mb-1 text-muted-foreground">{t.date}</div>
                        <div className="font-medium text-foreground">
                          {formatLocalizedDateFns(parseISO(selectedAppointment.appointment_date), "EEE, MMM d, yyyy", lang)}
                        </div>
                      </div>
                      <div className="rounded-xl bg-muted p-3">
                        <div className="mb-1 text-muted-foreground">{t.time}</div>
                        <div className="font-medium text-foreground">
                          {selectedAppointment.start_time.slice(0, 5)} - {selectedAppointment.end_time.slice(0, 5)}
                        </div>
                      </div>
                      <div className="rounded-xl bg-muted p-3">
                        <div className="mb-1 text-muted-foreground">{t.fee}</div>
                        <div className="font-medium text-foreground">{doc?.phone || "-"}</div>
                      </div>
                      <div className="rounded-xl bg-muted p-3">
                        <div className="mb-1 text-muted-foreground">{t.status}</div>
                        <div className="font-medium text-foreground">{getAppointmentStatusLabel(selectedAppointment.status, t)}</div>
                      </div>
                    </div>
                    {selectedAppointment.notes && (
                      <div className="rounded-xl bg-muted p-3">
                        <div className="mb-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <FileText className="h-3 w-3" /> {t.notes}
                        </div>
                        <p className="text-sm text-foreground">{selectedAppointment.notes}</p>
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
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.cancelling}
                          </>
                        ) : (
                          <>
                            <X className="mr-2 h-4 w-4" /> {t.cancelAppointment}
                          </>
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
