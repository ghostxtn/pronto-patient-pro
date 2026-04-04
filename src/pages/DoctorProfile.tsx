import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addMinutes, parse, isBefore, isToday } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Stethoscope,
  HeartPulse,
  Brain,
  Eye,
  Baby,
  Bone,
  ScanFace,
  Smile,
  Clock,
  FileText,
  CalendarCheck,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  stethoscope: Stethoscope,
  "heart-pulse": HeartPulse,
  brain: Brain,
  eye: Eye,
  baby: Baby,
  bone: Bone,
  "scan-face": ScanFace,
  smile: Smile,
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function DoctorProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const dayNames = [t.sunday, t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday];

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<string[]>([]);

  const { data: doctor, isLoading } = useQuery({
    queryKey: ["doctor", id],
    queryFn: async () => api.doctors.get(id!),
    enabled: !!id,
  });

  const { data: availability } = useQuery({
    queryKey: ["doctor-availability", id],
    queryFn: async () => {
      const data = await api.availability.listByDoctor(id!);
      return data.filter((slot: any) => slot.is_active !== false);
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (!id || !selectedDate) {
      setSlots([]);
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    void api.availability
      .getDoctorSlots(id, dateStr)
      .then((data) => setSlots(data))
      .catch(() => setSlots([]));
  }, [id, selectedDate]);

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedDate || !selectedSlot || !id) throw new Error("Missing data");
      const startTime = selectedSlot;
      const endTime = selectedSlotEndTime;
      if (!endTime) throw new Error("Missing slot end time");
      return api.appointments.create({
        patientId: user.id,
        doctorId: id,
        appointmentDate: format(selectedDate, "yyyy-MM-dd"),
        startTime,
        endTime,
        notes: notes || null,
      });
    },
    onSuccess: () => {
      toast.success(t.bookingSuccess);
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      navigate("/patient/appointments");
    },
    onError: (err: any) => toast.error(err.message || t.bookingFailed),
  });

  const availableDays = availability?.map((a) => a.day_of_week) || [];
  const isDateDisabled = (date: Date) => {
    if (isBefore(date, new Date()) && !isToday(date)) return true;
    return !availableDays.includes(date.getDay());
  };
  const availableSlots = slots;
  const selectedSlotDuration = useMemo(() => {
    if (!selectedDate || !selectedSlot || !availability) return 30;
    const dayOfWeek = selectedDate.getDay();
    const matchingBlock = availability.find((slot: any) => {
      if (slot.day_of_week !== dayOfWeek) return false;
      const start = slot.start_time?.slice(0, 5);
      const end = slot.end_time?.slice(0, 5);
      return Boolean(start && end && selectedSlot >= start && selectedSlot < end);
    });
    return matchingBlock?.slot_duration ?? 30;
  }, [availability, selectedDate, selectedSlot]);
  const selectedSlotEndTime = useMemo(() => {
    if (!selectedSlot) return null;
    return format(addMinutes(parse(selectedSlot, "HH:mm", new Date()), selectedSlotDuration), "HH:mm");
  }, [selectedSlot, selectedSlotDuration]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!doctor) {
    return (
      <AppLayout>
        <div className="py-20 text-center">
          <h2 className="mb-2 text-xl font-display font-bold">{t.doctorNotFound}</h2>
          <Button variant="outline" onClick={() => navigate("/patient/doctors")}>
            {t.backToDoctors}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const profile = {
    full_name: [doctor.firstName, doctor.lastName].filter(Boolean).join(" "),
    email: doctor.email,
  };
  const spec = doctor.specialization as any;
  const Icon = iconMap[spec?.icon || ""] || Stethoscope;

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible">
        <motion.div custom={0} variants={fadeUp}>
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 rounded-full px-4"
            onClick={() => navigate("/patient/doctors")}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> {t.backToDoctors}
          </Button>
        </motion.div>

        <div className="calendar-suite-hero mb-6 px-6 py-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="calendar-suite-label">Randevu Takvimi</div>
              <h1 className="mt-3 text-3xl font-display font-bold text-slate-950">Hekim ve slot secimi</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Tarih, saat ve randevu ozeti ayni yuzeyde ilerler. Yalnizca gercek musait slotlar secilebilir.
              </p>
            </div>
            <div className="calendar-suite-subpanel px-4 py-3">
              <div className="calendar-suite-label">Secili uzman</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                Dr. {profile.full_name || "Bilinmiyor"}
              </div>
              <div className="mt-1 text-xs text-slate-500">{spec?.name || "Uzmanlik belirtilmedi"}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <motion.div className="space-y-4 lg:col-span-1" custom={1} variants={fadeUp}>
            <div className="calendar-suite-panel p-6">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-info">
                  <span className="text-3xl font-display font-bold text-primary-foreground">
                    {profile.full_name?.[0] || "D"}
                  </span>
                </div>
                <h2 className="text-xl font-display font-bold text-slate-950">
                  Dr. {profile.full_name || "Unknown"}
                </h2>
                <Badge
                  variant="secondary"
                  className="mt-2 rounded-full border border-blue-100 bg-blue-50 text-primary"
                >
                  <Icon className="mr-1 h-3.5 w-3.5" />
                  {spec?.name || "General"}
                </Badge>
                {doctor.title ? <p className="mt-3 text-sm text-muted-foreground">{doctor.title}</p> : null}
                {profile.email ? <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p> : null}
              </div>
            </div>

            {doctor.bio ? (
              <div className="calendar-suite-panel p-6">
                <h3 className="mb-2 flex items-center gap-2 font-display font-semibold text-slate-900">
                  <FileText className="h-4 w-4" /> {t.about}
                </h3>
                <p className="text-sm text-muted-foreground">{doctor.bio}</p>
              </div>
            ) : null}

            <div className="calendar-suite-panel p-6">
              <h3 className="mb-3 flex items-center gap-2 font-display font-semibold text-slate-900">
                <Clock className="h-4 w-4" /> {t.weeklySchedule}
              </h3>
              <div className="space-y-2">
                {dayNames.map((day, idx) => {
                  const daySlots = availability?.filter((a) => a.day_of_week === idx);
                  return (
                    <div key={day} className="calendar-suite-subpanel flex items-center justify-between px-3 py-2 text-sm">
                      <span
                        className={cn(
                          "font-medium",
                          daySlots && daySlots.length > 0 ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {day}
                      </span>
                      {daySlots && daySlots.length > 0 ? (
                        <span className="text-muted-foreground">
                          {daySlots.map((s) => `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`).join(", ")}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">{t.unavailable}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div className="space-y-4 lg:col-span-2" custom={2} variants={fadeUp}>
            <div className="calendar-suite-shell px-5 py-5 lg:px-6">
              <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="calendar-suite-label">Hasta Randevu Yuzeyi</div>
                  <h2 className="mb-1 mt-2 flex items-center gap-2 text-xl font-display font-bold text-slate-950">
                    <CalendarCheck className="h-5 w-5 text-primary" /> {t.bookAnAppointment}
                  </h2>
                  <p className="text-sm text-slate-500">{t.selectDateAndTime}</p>
                </div>
                <div className="calendar-suite-subpanel px-4 py-3">
                  <div className="calendar-suite-label">Randevu kurali</div>
                  <div className="mt-2 text-sm font-medium text-slate-700">
                    Yalnizca uygun ve secilebilir slotlar listelenir.
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-[340px_minmax(0,1fr)]">
                <div className="calendar-suite-panel p-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">{t.selectDate}</h3>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setSelectedSlot(null);
                    }}
                    disabled={isDateDisabled}
                    className={cn("pointer-events-auto rounded-[24px] border border-slate-200 bg-white p-3")}
                    fromDate={new Date()}
                  />
                </div>

                <div className="calendar-suite-panel p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {selectedDate ? `${t.availableSlots} - ${format(selectedDate, "EEE, MMM d")}` : t.selectDateFirst}
                    </h3>
                    {selectedDate ? (
                      <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                        {availableSlots.length} slot
                      </div>
                    ) : null}
                  </div>

                  {selectedDate ? (
                    availableSlots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
                        {availableSlots.map((slot) => (
                          <Button
                            key={slot}
                            variant="outline"
                            size="sm"
                            className={cn(
                              "calendar-suite-slot h-12 justify-center rounded-2xl text-sm shadow-none",
                              selectedSlot === slot ? "calendar-suite-slot--selected" : "calendar-suite-slot--idle",
                            )}
                            onClick={() => setSelectedSlot(slot)}
                          >
                            {slot}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="calendar-suite-subpanel flex min-h-[220px] items-center justify-center px-6 text-center text-sm text-slate-500">
                        {t.noSlotsAvailable}
                      </div>
                    )
                  ) : (
                    <div className="calendar-suite-subpanel flex min-h-[220px] items-center justify-center px-6 text-center text-sm text-slate-500">
                      {t.pickDate}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedSlot && selectedDate ? (
              <motion.div
                className="calendar-suite-panel p-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="calendar-suite-label">Secili Randevu</div>
                    <h3 className="mt-2 font-display font-semibold text-slate-950">{t.additionalNotes}</h3>
                  </div>
                  <div className="calendar-suite-kicker">Slot: {selectedSlot}</div>
                </div>

                <Textarea
                  placeholder={t.symptomsPlaceholder}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mb-4 rounded-[22px] border-slate-200 bg-white"
                  rows={3}
                />

                <div className="calendar-suite-subpanel mb-4 p-4">
                  <h4 className="mb-2 text-sm font-semibold text-slate-900">{t.bookingSummary}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">{t.doctor}</span>
                    <span className="font-medium">Dr. {profile.full_name}</span>
                    <span className="text-muted-foreground">{t.specialty}</span>
                    <span className="font-medium">{spec?.name}</span>
                    <span className="text-muted-foreground">{t.date}</span>
                    <span className="font-medium">{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                    <span className="text-muted-foreground">{t.time}</span>
                    <span className="font-medium">
                      {selectedSlot} - {selectedSlotEndTime}
                    </span>
                  </div>
                </div>

                <Button
                  className="h-12 w-full rounded-2xl shadow-soft"
                  onClick={() => bookMutation.mutate()}
                  disabled={bookMutation.isPending}
                >
                  {bookMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.booking}
                    </>
                  ) : (
                    <>
                      <CalendarCheck className="mr-2 h-4 w-4" /> {t.confirmBooking}
                    </>
                  )}
                </Button>
              </motion.div>
            ) : null}
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
