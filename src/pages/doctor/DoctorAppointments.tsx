import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  CalendarDays, Clock, CheckCircle2, XCircle, AlertCircle, FileText,
  Loader2, Check, X, MessageSquarePlus, Send,
} from "lucide-react";

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

export default function DoctorAppointments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [clinicalNote, setClinicalNote] = useState("");

  const { data: doctorRecord } = useQuery({
    queryKey: ["my-doctor-record", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["doctor-appointments-list", doctorRecord?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`*, profiles!appointments_patient_id_fkey (full_name, avatar_url, email, phone)`)
        .eq("doctor_id", doctorRecord!.id)
        .order("appointment_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!doctorRecord,
  });

  const { data: notes } = useQuery({
    queryKey: ["appointment-notes", detailId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointment_notes")
        .select("*")
        .eq("appointment_id", detailId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!detailId,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("appointments")
        .update({ status: status as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Appointment updated");
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments-list"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-all-appointments"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addNote = useMutation({
    mutationFn: async () => {
      if (!user || !detailId || !clinicalNote.trim()) throw new Error("Missing data");
      const { error } = await supabase.from("appointment_notes").insert({
        appointment_id: detailId,
        content: clinicalNote.trim(),
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Note added");
      setClinicalNote("");
      queryClient.invalidateQueries({ queryKey: ["appointment-notes"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const pending = appointments?.filter((a) => a.status === "pending") || [];
  const confirmed = appointments?.filter((a) => a.status === "confirmed") || [];
  const completed = appointments?.filter((a) => a.status === "completed") || [];
  const cancelled = appointments?.filter((a) => a.status === "cancelled") || [];
  const selectedAppointment = appointments?.find((a) => a.id === detailId);

  const renderAppointmentList = (list: typeof appointments) => {
    if (!list || list.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No appointments in this category.
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {list.map((apt, i) => {
          const patient = apt.profiles as any;
          const status = statusConfig[apt.status];
          const StatusIcon = status.icon;
          return (
            <motion.div
              key={apt.id}
              className="glass rounded-2xl p-5 shadow-card hover:shadow-elevated transition-all cursor-pointer"
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              onClick={() => { setDetailId(apt.id); setClinicalNote(""); }}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-secondary to-success flex items-center justify-center flex-shrink-0">
                    <span className="text-secondary-foreground font-display font-bold">
                      {patient?.full_name?.[0] || "P"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-display font-semibold truncate">{patient?.full_name || "Patient"}</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {format(parseISO(apt.appointment_date), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {apt.start_time.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {apt.status === "pending" && (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-success hover:text-success hover:bg-success/10"
                        onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: apt.id, status: "confirmed" }); }}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: apt.id, status: "cancelled" }); }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {apt.status === "confirmed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full text-xs"
                      onClick={(e) => { e.stopPropagation(); updateStatus.mutate({ id: apt.id, status: "completed" }); }}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Complete
                    </Button>
                  )}
                  <Badge className={cn("rounded-full border", status.color)} variant="outline">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    <span className="hidden sm:inline">{status.label}</span>
                  </Badge>
                </div>
              </div>
              {apt.notes && (
                <div className="mt-3 p-2 rounded-lg bg-muted/50 text-xs text-muted-foreground flex items-start gap-2">
                  <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{apt.notes}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible">
        <motion.div className="mb-8" custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold mb-2">Appointments</h1>
          <p className="text-muted-foreground">Review and manage patient appointments.</p>
        </motion.div>

        <Tabs defaultValue="pending">
          <motion.div custom={1} variants={fadeUp}>
            <TabsList className="rounded-xl mb-6">
              <TabsTrigger value="pending" className="rounded-lg">
                Pending {pending.length > 0 && <Badge className="ml-1.5 h-5 min-w-5 rounded-full bg-warning text-warning-foreground text-xs">{pending.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="rounded-lg">Confirmed ({confirmed.length})</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg">Completed ({completed.length})</TabsTrigger>
              <TabsTrigger value="cancelled" className="rounded-lg">Cancelled ({cancelled.length})</TabsTrigger>
            </TabsList>
          </motion.div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-2xl p-5 shadow-card animate-pulse h-20" />
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="pending">{renderAppointmentList(pending)}</TabsContent>
              <TabsContent value="confirmed">{renderAppointmentList(confirmed)}</TabsContent>
              <TabsContent value="completed">{renderAppointmentList(completed)}</TabsContent>
              <TabsContent value="cancelled">{renderAppointmentList(cancelled)}</TabsContent>
            </>
          )}
        </Tabs>
      </motion.div>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
          {selectedAppointment && (() => {
            const patient = selectedAppointment.profiles as any;
            const status = statusConfig[selectedAppointment.status];
            const StatusIcon = status.icon;
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
                  {/* Patient Info */}
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-secondary to-success flex items-center justify-center">
                      <span className="text-secondary-foreground font-display font-bold">
                        {patient?.full_name?.[0] || "P"}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold">{patient?.full_name || "Patient"}</div>
                      <div className="text-sm text-muted-foreground">{patient?.email}</div>
                      {patient?.phone && <div className="text-sm text-muted-foreground">{patient.phone}</div>}
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-muted">
                      <div className="text-muted-foreground mb-1">Date</div>
                      <div className="font-medium">{format(parseISO(selectedAppointment.appointment_date), "EEE, MMM d, yyyy")}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-muted">
                      <div className="text-muted-foreground mb-1">Time</div>
                      <div className="font-medium">{selectedAppointment.start_time.slice(0, 5)} — {selectedAppointment.end_time.slice(0, 5)}</div>
                    </div>
                  </div>

                  {/* Patient Notes */}
                  {selectedAppointment.notes && (
                    <div className="p-3 rounded-xl bg-muted">
                      <div className="text-muted-foreground text-sm mb-1 flex items-center gap-1">
                        <FileText className="h-3 w-3" /> Patient Notes
                      </div>
                      <p className="text-sm">{selectedAppointment.notes}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {selectedAppointment.status === "pending" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        className="rounded-xl bg-success hover:bg-success/90 text-success-foreground"
                        onClick={() => updateStatus.mutate({ id: selectedAppointment.id, status: "confirmed" })}
                        disabled={updateStatus.isPending}
                      >
                        <Check className="mr-2 h-4 w-4" /> Confirm
                      </Button>
                      <Button
                        variant="destructive"
                        className="rounded-xl"
                        onClick={() => updateStatus.mutate({ id: selectedAppointment.id, status: "cancelled" })}
                        disabled={updateStatus.isPending}
                      >
                        <X className="mr-2 h-4 w-4" /> Decline
                      </Button>
                    </div>
                  )}
                  {selectedAppointment.status === "confirmed" && (
                    <Button
                      className="w-full rounded-xl"
                      onClick={() => updateStatus.mutate({ id: selectedAppointment.id, status: "completed" })}
                      disabled={updateStatus.isPending}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Completed
                    </Button>
                  )}

                  {/* Clinical Notes */}
                  <div className="border-t pt-4">
                    <h4 className="font-display font-semibold mb-3 flex items-center gap-2">
                      <MessageSquarePlus className="h-4 w-4" /> Clinical Notes
                    </h4>
                    {notes && notes.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        {notes.map((note) => (
                          <div key={note.id} className="p-3 rounded-xl bg-accent/50 text-sm">
                            <p>{note.content}</p>
                            <div className="text-xs text-muted-foreground mt-1">
                              {format(new Date(note.created_at), "MMM d, yyyy h:mm a")}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-4">No clinical notes yet.</p>
                    )}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Add a clinical note..."
                        value={clinicalNote}
                        onChange={(e) => setClinicalNote(e.target.value)}
                        className="rounded-xl text-sm"
                        rows={2}
                      />
                      <Button
                        size="icon"
                        className="rounded-xl h-auto"
                        onClick={() => addNote.mutate()}
                        disabled={!clinicalNote.trim() || addNote.isPending}
                      >
                        {addNote.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
