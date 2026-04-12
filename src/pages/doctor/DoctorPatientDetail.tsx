import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Plus,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { AppointmentDetailSheet } from "@/components/appointments/AppointmentDetailSheet";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import type { Appointment, ClinicalNote } from "@/types/calendar";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

interface PatientRecord {
  id: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  full_name?: string;
  fullName?: string;
  email?: string | null;
  phone?: string | null;
}

interface DoctorRecord {
  id: string;
  user_id: string;
}

interface AppointmentProfile {
  id?: string;
  full_name?: string;
  fullName?: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface AppointmentResponse {
  id: string;
  doctor_id: string;
  patient_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  type?: string;
  notes?: string;
  patient?: AppointmentProfile | null;
  profile?: AppointmentProfile | null;
  profiles?: AppointmentProfile | null;
}

function getPatientName(patient?: PatientRecord | AppointmentProfile | null) {
  if (!patient) return "İsimsiz Hasta";

  return (
    patient.full_name
    ?? patient.fullName
    ?? [patient.first_name ?? patient.firstName, patient.last_name ?? patient.lastName]
      .filter(Boolean)
      .join(" ")
      .trim()
  ) || "İsimsiz Hasta";
}

function toAppointment(
  appointment: AppointmentResponse,
  fallbackPatient: PatientRecord | undefined,
): Appointment {
  const patientProfile = appointment.profiles ?? appointment.profile ?? appointment.patient ?? null;

  return {
    id: appointment.id,
    doctor_id: appointment.doctor_id,
    patient_id: appointment.patient_id,
    appointment_date: appointment.appointment_date,
    start_time: appointment.start_time,
    end_time: appointment.end_time,
    status: appointment.status,
    type: appointment.type ?? "",
    notes: appointment.notes,
    patient: {
      id: patientProfile?.id ?? fallbackPatient?.id ?? appointment.patient_id,
      firstName:
        patientProfile?.firstName
        ?? patientProfile?.first_name
        ?? fallbackPatient?.firstName
        ?? fallbackPatient?.first_name
        ?? "",
      lastName:
        patientProfile?.lastName
        ?? patientProfile?.last_name
        ?? fallbackPatient?.lastName
        ?? fallbackPatient?.last_name
        ?? "",
      fullName: getPatientName(patientProfile ?? fallbackPatient),
      email: patientProfile?.email ?? fallbackPatient?.email ?? undefined,
      phone: patientProfile?.phone ?? fallbackPatient?.phone ?? undefined,
    },
  };
}

function getStatusConfig(status: string) {
  const config: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    pending: { color: "border-[rgba(245,166,35,0.3)] bg-[#fff8e6] text-[#f5a623]", icon: AlertCircle, label: "Bekliyor" },
    confirmed: { color: "border-[#b5d1cc] bg-[#eaf5ff] text-[#4f8fe6]", icon: CheckCircle2, label: "Onaylandı" },
    completed: { color: "border-[#b5d1cc] bg-[#e6f4ef] text-[#65a98f]", icon: CheckCircle2, label: "Tamamlandı" },
    cancelled: { color: "border-[rgba(252,165,165,0.3)] bg-[#fef2f2] text-[#e05252]", icon: XCircle, label: "İptal" },
  };

  return config[status] ?? config.pending;
}

export default function DoctorPatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const { data: doctorRecord } = useQuery<DoctorRecord>({
    queryKey: ["my-doctor-record", user?.id],
    queryFn: async () => {
      const doctors = await api.doctors.list() as DoctorRecord[];
      const doctor = doctors.find((item) => item.user_id === user!.id);
      if (!doctor) {
        throw new Error("Doctor record not found");
      }
      return doctor;
    },
    enabled: !!user,
  });

  const { data: patient, isLoading: isPatientLoading } = useQuery<PatientRecord>({
    queryKey: ["doctor-patient", id],
    queryFn: async () => {
      if (!id) throw new Error("Patient id is required");

      try {
        return await api.patients.get(id);
      } catch {
        const result = await api.patients.list();
        const patients = Array.isArray(result) ? result : (result?.data ?? []);
        const matched = patients.find((item: PatientRecord) => item.id === id);
        if (!matched) {
          throw new Error("Patient not found");
        }
        return matched;
      }
    },
    enabled: !!id,
  });

  const { data: appointmentsResult, isLoading: isAppointmentsLoading } = useQuery<AppointmentResponse[]>({
    queryKey: ["doctor-patient-appointments", id],
    queryFn: async () => api.appointments.list({ patient_id: id! }) as unknown as AppointmentResponse[],
    enabled: !!id,
  });

  const { data: clinicalNotes, isLoading: isClinicalNotesLoading } = useQuery<ClinicalNote[]>({
    queryKey: ["doctor-patient-clinical-notes", id],
    queryFn: async () => {
      const data = await api.clinicalNotes.listByPatient(id!);
      return [...data].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    },
    enabled: !!id,
  });

  const createClinicalNote = useMutation({
    mutationFn: async () => {
      if (!id || !doctorRecord?.id) {
        throw new Error("Eksik doktor veya hasta bilgisi");
      }

      const payload: {
        patient_id: string;
        doctor_id: string;
        diagnosis?: string;
        treatment?: string;
        prescription?: string;
        notes?: string;
      } = {
        patient_id: id,
        doctor_id: doctorRecord.id,
      };

      if (diagnosis.trim()) payload.diagnosis = diagnosis.trim();
      if (treatment.trim()) payload.treatment = treatment.trim();
      if (prescription.trim()) payload.prescription = prescription.trim();
      if (notes.trim()) payload.notes = notes.trim();

      return api.clinicalNotes.create(payload);
    },
    onSuccess: () => {
      toast.success("Klinik not kaydedildi");
      setIsFormOpen(false);
      setDiagnosis("");
      setTreatment("");
      setPrescription("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["doctor-patient-clinical-notes", id] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Klinik not kaydedilemedi");
    },
  });

  const patientName = getPatientName(patient);
  const hasAtLeastOneField = [diagnosis, treatment, prescription, notes].some(
    (value) => value.trim().length > 0,
  );
  const appointments = (appointmentsResult ?? [])
    .map((appointment) => toAppointment(appointment, patient))
    .sort((a, b) => {
      const left = new Date(`${b.appointment_date}T${b.start_time}`).getTime();
      const right = new Date(`${a.appointment_date}T${a.start_time}`).getTime();
      return left - right;
    });
  const pastAppointments = appointments.filter(
    (appointment) => appointment.status === "completed" || appointment.status === "cancelled",
  );
  const selectedAppointment = pastAppointments.find((appointment) => appointment.id === selectedAppointmentId) ?? null;

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6 rounded-[28px] bg-[#f4f8fd] p-1">
        <motion.div custom={0} variants={fadeUp}>
          <Button
            type="button"
            variant="ghost"
            className="mb-4 rounded-xl px-0 hover:bg-transparent"
            style={{ color: "#4f8fe6", fontFamily: "Inter, sans-serif" }}
            onClick={() => navigate("/doctor/patients")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Hastalara Dön
          </Button>
        </motion.div>

        <motion.div custom={1} variants={fadeUp}>
          <Card className="rounded-2xl border border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.08)]">
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                {isPatientLoading ? (
                  <>
                    <Skeleton className="h-7 w-48 rounded-xl" />
                    <Skeleton className="h-4 w-56 rounded-lg" />
                    <Skeleton className="h-4 w-40 rounded-lg" />
                  </>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>{patientName}</h1>
                    <p className="text-sm" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>{patient?.email || "E-posta bilgisi yok"}</p>
                    <p className="text-sm" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>{patient?.phone || "Telefon bilgisi yok"}</p>
                  </>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                className="rounded-xl border-[#b5d1cc] text-[#4f8fe6] hover:bg-[#eaf5ff] hover:text-[#2f75ca]"
                style={{ fontFamily: "Inter, sans-serif" }}
                onClick={() => navigate("/doctor/patients")}
              >
                Geri
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <motion.div custom={2} variants={fadeUp} className="space-y-6">
            <Card className="rounded-2xl border border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.08)]">
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div>
                  <CardTitle className="text-xl text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>Klinik Notlar</CardTitle>
                  <p className="mt-1 text-sm" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>
                    Hastaya ait klinik değerlendirmeler ve tedavi notları.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-[#b5d1cc] text-[#4f8fe6] hover:bg-[#eaf5ff] hover:text-[#2f75ca]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                  onClick={() => setIsFormOpen((current) => !current)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Klinik Not Ekle
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {isFormOpen ? (
                  <div className="space-y-4 rounded-2xl p-4" style={{ backgroundColor: "#f4f8fd" }}>
                    <div className="space-y-2">
                      <Label htmlFor="clinical-note-diagnosis" style={{ color: "#1a2e3b", fontFamily: "Inter, sans-serif" }}>Tanı</Label>
                      <Textarea
                        id="clinical-note-diagnosis"
                        rows={3}
                        value={diagnosis}
                        onChange={(event) => setDiagnosis(event.target.value)}
                        className="rounded-xl text-sm border-[#b5d1cc] focus-visible:ring-[#4f8fe6]/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clinical-note-treatment" style={{ color: "#1a2e3b", fontFamily: "Inter, sans-serif" }}>Tedavi</Label>
                      <Textarea
                        id="clinical-note-treatment"
                        rows={3}
                        value={treatment}
                        onChange={(event) => setTreatment(event.target.value)}
                        className="rounded-xl text-sm border-[#b5d1cc] focus-visible:ring-[#4f8fe6]/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clinical-note-prescription" style={{ color: "#1a2e3b", fontFamily: "Inter, sans-serif" }}>Reçete</Label>
                      <Textarea
                        id="clinical-note-prescription"
                        rows={3}
                        value={prescription}
                        onChange={(event) => setPrescription(event.target.value)}
                        className="rounded-xl text-sm border-[#b5d1cc] focus-visible:ring-[#4f8fe6]/30"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clinical-note-notes" style={{ color: "#1a2e3b", fontFamily: "Inter, sans-serif" }}>Not</Label>
                      <Textarea
                        id="clinical-note-notes"
                        rows={4}
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        className="rounded-xl text-sm border-[#b5d1cc] focus-visible:ring-[#4f8fe6]/30"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        className="rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        style={{ backgroundColor: "#4f8fe6", fontFamily: "Inter, sans-serif" }}
                        onClick={() => createClinicalNote.mutate()}
                        disabled={!hasAtLeastOneField || createClinicalNote.isPending}
                      >
                        {createClinicalNote.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                        ) : null}
                        Kaydet
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-xl"
                        style={{ color: "#5a7a8a" }}
                        onClick={() => setIsFormOpen(false)}
                      >
                        Vazgeç
                      </Button>
                    </div>
                  </div>
                ) : null}

                {isClinicalNotesLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="rounded-2xl border border-border/60 p-4">
                        <Skeleton className="h-4 w-44 rounded-lg" />
                        <Skeleton className="mt-3 h-3 w-28 rounded-lg" />
                        <Skeleton className="mt-4 h-3 w-full rounded-lg" />
                        <Skeleton className="mt-2 h-3 w-5/6 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : clinicalNotes && clinicalNotes.length > 0 ? (
                  <div className="space-y-4">
                    {clinicalNotes.map((note) => (
                      <Card key={note.id} className="rounded-2xl border border-[#b5d1cc] bg-white shadow-none">
                        <CardHeader className="space-y-2 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-full p-2" style={{ backgroundColor: "#eaf5ff" }}>
                              <UserRound className="h-4 w-4" style={{ color: "#4f8fe6" }} />
                            </div>
                            <div>
                              <CardTitle className="text-base font-semibold text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>
                                {[note.doctor.title, note.doctor.firstName, note.doctor.lastName].filter(Boolean).join(" ")}
                              </CardTitle>
                              <p className="text-xs" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>
                                {format(new Date(note.created_at), "d MMMM yyyy, HH:mm", { locale: tr })}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm" style={{ color: "#1a2e3b", fontFamily: "Inter, sans-serif" }}>
                          {note.diagnosis ? (
                            <p><span className="font-medium">Tanı:</span> {note.diagnosis}</p>
                          ) : null}
                          {note.treatment ? (
                            <p><span className="font-medium">Tedavi:</span> {note.treatment}</p>
                          ) : null}
                          {note.prescription ? (
                            <p><span className="font-medium">Reçete:</span> {note.prescription}</p>
                          ) : null}
                          {note.notes ? (
                            <p><span className="font-medium">Not:</span> {note.notes}</p>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#b5d1cc] p-6 text-sm" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>
                    Bu hasta için henüz klinik not eklenmemiş.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={3} variants={fadeUp}>
            <Card className="rounded-2xl border border-[#b5d1cc] bg-white shadow-[0_2px_12px_rgba(79,143,230,0.08)]">
              <CardHeader>
                <CardTitle className="text-xl text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>Randevu Geçmişi</CardTitle>
                <p className="text-sm" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>
                  En yeni randevular üstte listelenir. Detay için karta tıklayın.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {isAppointmentsLoading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="rounded-2xl border border-border/60 p-4">
                      <Skeleton className="h-4 w-40 rounded-lg" />
                      <Skeleton className="mt-2 h-3 w-24 rounded-lg" />
                      <Skeleton className="mt-4 h-8 w-28 rounded-full" />
                    </div>
                  ))
                ) : pastAppointments.length > 0 ? (
                  pastAppointments.map((appointment) => {
                    const status = getStatusConfig(appointment.status);
                    const StatusIcon = status.icon;

                    return (
                      <button
                        key={appointment.id}
                        type="button"
                        className="w-full rounded-2xl border border-[#b5d1cc] bg-white p-4 text-left transition-colors hover:bg-[#eaf5ff] hover:border-[#4f8fe6]"
                        onClick={() => setSelectedAppointmentId(appointment.id)}
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-[#1a2e3b]" style={{ fontFamily: "Manrope, sans-serif" }}>
                                {format(parseISO(appointment.appointment_date), "d MMMM yyyy", {
                                  locale: tr,
                                })}
                              </p>
                              <p className="text-sm" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>
                                {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
                              </p>
                            </div>
                            <Badge className={cn("rounded-full border", status.color)} variant="outline" style={{ fontFamily: "Inter, sans-serif" }}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {status.label}
                            </Badge>
                          </div>
                          {appointment.notes ? (
                            <div className="flex items-start gap-2 text-sm" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>
                              <FileText className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: "#4f8fe6" }} />
                              <span className="line-clamp-2">{appointment.notes}</span>
                            </div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#b5d1cc] p-6 text-sm" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>
                    Henüz tamamlanmış randevu bulunmuyor.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      <AppointmentDetailSheet
        appointment={selectedAppointment}
        open={Boolean(selectedAppointmentId)}
        onClose={() => setSelectedAppointmentId(null)}
      />
    </AppLayout>
  );
}
