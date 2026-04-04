import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import type { Appointment, ClinicalNote } from "@/types/calendar";
import { parseCalendarDate } from "@/utils/calendarUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
    no_show: { color: "bg-slate-200 text-slate-700 border-slate-300", icon: XCircle, label: "Gelmedi" },
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
    appointment?.patient.fullName ??
    [appointment?.patient.firstName, appointment?.patient.lastName].filter(Boolean).join(" ").trim()
  ) || t.patient;
  const status = appointment ? statusConfig[appointment.status] : null;
  const StatusIcon = status?.icon;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="calendar-suite-dialog sm:max-w-2xl max-h-[88vh] overflow-y-auto border-0 p-0">
        {appointment && status && StatusIcon ? (
          <>
            <div className="calendar-suite-dialog-header px-6 py-5">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl font-bold text-white">
                  Randevu Detayi
                </DialogTitle>
                <DialogDescription className="text-blue-50">
                  Secili randevunun hasta, zaman ve islem detaylari.
                </DialogDescription>
                <div>
                  <Badge className={cn("mt-3 rounded-full border bg-white/10 text-white", status.color)} variant="outline">
                    <StatusIcon className="mr-1 h-3 w-3" /> {status.label}
                  </Badge>
                </div>
              </DialogHeader>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="calendar-suite-subpanel flex items-center gap-4 px-4 py-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary to-success">
                  <span className="font-display text-lg font-bold text-secondary-foreground">
                    {patientName[0] || "P"}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-base font-semibold text-slate-950">{patientName}</div>
                  {appointment.patient.email ? (
                    <div className="truncate text-sm text-muted-foreground">{appointment.patient.email}</div>
                  ) : null}
                  {appointment.patient.phone ? (
                    <div className="text-sm text-muted-foreground">{appointment.patient.phone}</div>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="calendar-suite-subpanel p-4 text-sm">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Tarih
                  </div>
                  <div className="font-medium text-slate-900">
                    {format(parseCalendarDate(appointment.appointment_date), "d MMMM yyyy, EEEE", { locale: tr })}
                  </div>
                </div>
                <div className="calendar-suite-subpanel p-4 text-sm">
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Saat
                  </div>
                  <div className="font-medium text-slate-900">
                    {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
                  </div>
                </div>
              </div>

              {appointment.notes ? (
                <div className="calendar-suite-subpanel p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
                    <FileText className="h-4 w-4" /> Hasta notu
                  </div>
                  <p className="text-sm text-slate-700">{appointment.notes}</p>
                </div>
              ) : null}

              {appointment.status === "confirmed" && onStatusUpdate ? (
                <Button
                  className="h-12 w-full rounded-2xl"
                  onClick={() => onStatusUpdate(appointment.id, "completed")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> {t.markCompleted}
                </Button>
              ) : null}

              {!isStaff ? (
                <div className="space-y-4 border-t border-slate-200 pt-5">
                  <div>
                    <div className="calendar-suite-label">Klinik Notlar</div>
                    <h4 className="mt-2 font-display text-lg font-semibold text-slate-950">Gecmis ve yeni notlar</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Hastaya ait klinik not gecmisi burada listelenir.
                    </p>
                  </div>

                  {isClinicalNotesLoading ? (
                    <div className="calendar-suite-subpanel flex items-center gap-2 p-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Klinik notlar yukleniyor...
                    </div>
                  ) : clinicalNotes && clinicalNotes.length > 0 ? (
                    <div className="space-y-3">
                      {clinicalNotes.map((note) => (
                        <Card key={note.id} className="calendar-suite-subpanel border-0 shadow-none">
                          <CardHeader className="space-y-2 pb-3">
                            <div className="flex items-start justify-between gap-3">
                              <CardTitle className="text-base font-semibold">
                                {[note.doctor.title, note.doctor.firstName, note.doctor.lastName]
                                  .filter(Boolean)
                                  .join(" ")}
                              </CardTitle>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(note.created_at), "d MMMM yyyy, HH:mm", { locale: tr })}
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
                    <p className="text-sm text-muted-foreground">Henuz klinik not eklenmemis.</p>
                  )}

                  <div className="calendar-suite-panel p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-display font-semibold text-slate-950">Yeni Klinik Not</h4>
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
                        Yeni Not
                      </Button>
                    </div>

                    {isNoteFormOpen ? (
                      <div className="mt-5 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="clinical-note-diagnosis">Tani</Label>
                          <Textarea
                            id="clinical-note-diagnosis"
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            className="rounded-[20px] border-slate-200 bg-white text-sm"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="clinical-note-treatment">Tedavi</Label>
                          <Textarea
                            id="clinical-note-treatment"
                            value={treatment}
                            onChange={(e) => setTreatment(e.target.value)}
                            className="rounded-[20px] border-slate-200 bg-white text-sm"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="clinical-note-prescription">Recete</Label>
                          <Textarea
                            id="clinical-note-prescription"
                            value={prescription}
                            onChange={(e) => setPrescription(e.target.value)}
                            className="rounded-[20px] border-slate-200 bg-white text-sm"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="clinical-note-notes">Genel Not</Label>
                          <Textarea
                            id="clinical-note-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="rounded-[20px] border-slate-200 bg-white text-sm"
                            rows={4}
                          />
                        </div>

                        <Button
                          type="button"
                          className="h-12 w-full rounded-2xl"
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
              ) : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
