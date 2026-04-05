import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import type { Appointment, ClinicalNote } from "@/types/calendar";

export interface AppointmentDetailSheetProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate?: (id: string, status: string) => void;
}

export function AppointmentDetailSheet({
  appointment,
  open,
  onClose,
  onStatusUpdate,
}: AppointmentDetailSheetProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const isStaff = user?.role === "staff";
  const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) {
      setIsNoteFormOpen(false);
      setDiagnosis("");
      setTreatment("");
      setPrescription("");
      setNotes("");
    }
  }, [open, appointment?.id]);

  const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    pending: { color: "bg-warning/10 text-warning border-warning/20", icon: AlertCircle, label: t.pending },
    confirmed: { color: "bg-success/10 text-success border-success/20", icon: CheckCircle2, label: t.confirmed },
    completed: { color: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle2, label: t.completed },
    cancelled: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle, label: t.cancelled },
  };

  const { data: clinicalNotes, isLoading: isClinicalNotesLoading } = useQuery<ClinicalNote[]>({
    queryKey: ["clinical-notes", appointment?.patient.id],
    queryFn: async () => api.clinicalNotes.listByPatient(appointment!.patient.id),
    enabled: !isStaff && open && Boolean(appointment?.patient.id),
  });

  const hasAtLeastOneField = [diagnosis, treatment, prescription, notes].some(
    (value) => value.trim().length > 0,
  );

  const createClinicalNote = useMutation({
    mutationFn: async () => {
      if (!appointment?.id || !appointment?.patient.id || !appointment.doctor_id) {
        throw new Error("Missing data");
      }

      const payload: {
        patient_id: string;
        doctor_id: string;
        appointment_id: string;
        diagnosis?: string;
        treatment?: string;
        prescription?: string;
        notes?: string;
      } = {
        patient_id: appointment.patient.id,
        doctor_id: appointment.doctor_id,
        appointment_id: appointment.id,
      };

      if (diagnosis.trim()) payload.diagnosis = diagnosis.trim();
      if (treatment.trim()) payload.treatment = treatment.trim();
      if (prescription.trim()) payload.prescription = prescription.trim();
      if (notes.trim()) payload.notes = notes.trim();

      return api.clinicalNotes.create(payload);
    },
    onSuccess: () => {
      toast.success("Klinik not kaydedildi");
      setIsNoteFormOpen(false);
      setDiagnosis("");
      setTreatment("");
      setPrescription("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["clinical-notes", appointment?.patient.id] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Klinik not kaydedilemedi"),
  });

  const patientName = (
    appointment?.patient.fullName
    ?? [appointment?.patient.firstName, appointment?.patient.lastName].filter(Boolean).join(" ").trim()
  ) || t.patient;
  const status = appointment ? statusConfig[appointment.status] : null;
  const StatusIcon = status?.icon;

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        side="right"
        overlayClassName="bg-foreground/10 backdrop-blur-sm data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        className="w-full overflow-y-auto border-l border-border/40 bg-background/95 backdrop-blur-2xl px-0 shadow-2xl sm:max-w-[32rem]"
      >
        {appointment && status && StatusIcon ? (
          <>
            <SheetHeader className="border-b border-border/50 px-6 pb-5 pt-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Takvim ayrintisi
                  </p>
                  <SheetTitle className="mt-2 font-display text-[1.45rem]">{t.appointmentDetails}</SheetTitle>
                </div>
                <Badge className={cn("shrink-0 rounded-full border", status.color)} variant="outline">
                  <StatusIcon className="mr-1 h-3 w-3" /> {status.label}
                </Badge>
              </div>
              <SheetDescription className="text-sm">
                Secili randevu takvim baglamindan kopmadan sag panelde acilir.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 px-6 py-6">
              <div className="rounded-[24px] border border-border/60 bg-card/90 p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-primary/10 text-lg font-display font-bold text-primary">
                    {patientName[0] || "P"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground">{patientName}</div>
                    {appointment.patient.email ? (
                      <div className="truncate text-sm text-muted-foreground">{appointment.patient.email}</div>
                    ) : null}
                    {appointment.patient.phone ? (
                      <div className="text-sm text-muted-foreground">{appointment.patient.phone}</div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-[20px] border border-border/60 bg-background/70 p-3">
                  <div className="mb-1 text-muted-foreground">{t.date}</div>
                  <div className="font-medium">
                    {format(parseISO(appointment.appointment_date), "EEE, MMM d, yyyy")}
                  </div>
                </div>
                <div className="rounded-[20px] border border-border/60 bg-background/70 p-3">
                  <div className="mb-1 text-muted-foreground">{t.time}</div>
                  <div className="font-medium">
                    {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
                  </div>
                </div>
              </div>

              {appointment.notes ? (
                <div className="rounded-[20px] border border-border/60 bg-background/70 p-3">
                  <div className="mb-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <FileText className="h-3 w-3" /> {t.patientNotes}
                  </div>
                  <p className="text-sm">{appointment.notes}</p>
                </div>
              ) : null}

              {appointment.status === "confirmed" && onStatusUpdate ? (
                <Button
                  className="w-full rounded-xl"
                  onClick={() => onStatusUpdate(appointment.id, "completed")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> {t.markCompleted}
                </Button>
              ) : null}

              {!isStaff ? (
                <div className="border-t border-border/50 pt-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-display font-semibold">Gecmis Notlar</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Hastaya ait onceki klinik notlar burada listelenir.
                      </p>
                    </div>

                    {isClinicalNotesLoading ? (
                      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/70 p-3 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Klinik notlar yukleniyor...
                      </div>
                    ) : clinicalNotes && clinicalNotes.length > 0 ? (
                      <div className="space-y-3">
                        {clinicalNotes.map((note) => (
                          <Card key={note.id} className="rounded-2xl border-border/60 shadow-none">
                            <CardHeader className="space-y-2 pb-3">
                              <div className="flex items-start justify-between gap-3">
                                <CardTitle className="text-base font-semibold">
                                  {[note.doctor.title, note.doctor.firstName, note.doctor.lastName]
                                    .filter(Boolean)
                                    .join(" ")}
                                </CardTitle>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(note.created_at), "d MMMM yyyy, HH:mm", {
                                    locale: tr,
                                  })}
                                </span>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              {note.diagnosis ? <p><span className="font-medium">Tani:</span> {note.diagnosis}</p> : null}
                              {note.treatment ? <p><span className="font-medium">Tedavi:</span> {note.treatment}</p> : null}
                              {note.prescription ? <p><span className="font-medium">Recete:</span> {note.prescription}</p> : null}
                              {note.notes ? <p><span className="font-medium">Not:</span> {note.notes}</p> : null}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Henuz klinik not eklenmemis.
                      </p>
                    )}

                    <div className="space-y-3 rounded-[24px] border border-border/60 bg-background/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="font-display font-semibold">Yeni Not Ekle</h4>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Tani, tedavi, recete veya genel not bilgisi ekleyin.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => setIsNoteFormOpen((current) => !current)}
                        >
                          + Yeni Klinik Not Ekle
                        </Button>
                      </div>

                      {isNoteFormOpen ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="clinical-note-diagnosis">Tani</Label>
                            <Textarea
                              id="clinical-note-diagnosis"
                              value={diagnosis}
                              onChange={(e) => setDiagnosis(e.target.value)}
                              className="rounded-xl text-sm"
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="clinical-note-treatment">Tedavi</Label>
                            <Textarea
                              id="clinical-note-treatment"
                              value={treatment}
                              onChange={(e) => setTreatment(e.target.value)}
                              className="rounded-xl text-sm"
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="clinical-note-prescription">Recete</Label>
                            <Textarea
                              id="clinical-note-prescription"
                              value={prescription}
                              onChange={(e) => setPrescription(e.target.value)}
                              className="rounded-xl text-sm"
                              rows={3}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="clinical-note-notes">Genel Not</Label>
                            <Textarea
                              id="clinical-note-notes"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="rounded-xl text-sm"
                              rows={4}
                            />
                          </div>

                          <Button
                            type="button"
                            className="w-full rounded-xl"
                            onClick={() => createClinicalNote.mutate()}
                            disabled={!hasAtLeastOneField || createClinicalNote.isPending}
                          >
                            {createClinicalNote.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Kaydet
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
