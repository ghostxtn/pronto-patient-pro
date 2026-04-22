import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, isBefore, isToday } from "date-fns";
import { getDateFnsLocale } from "@/lib/date-localization";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Stethoscope, HeartPulse, Brain, Eye, Baby, Bone, ScanFace, Smile,
  Clock, FileText, CalendarCheck, Loader2, ArrowLeft,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  stethoscope: Stethoscope, "heart-pulse": HeartPulse, brain: Brain,
  eye: Eye, baby: Baby, bone: Bone, "scan-face": ScanFace, smile: Smile,
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function DoctorProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locale = useMemo(() => getDateFnsLocale(lang), [lang]);

  const dayNames = [t.sunday, t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday];

  type SlotOption = {
    startTime: string;
    endTime: string;
    duration: number;
  };

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<SlotOption[]>([]);

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
      return api.appointments.create({
        patientId: user.id,
        doctorId: id,
        appointmentDate: format(selectedDate, "yyyy-MM-dd"),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        notes: notes || null,
      });
    },
    onSuccess: () => { toast.success(t.bookingSuccess); queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] }); navigate("/patient/appointments"); },
    onError: (err: any) => toast.error(err.message || t.bookingFailed),
  });

  const weeklyAvailability = availability?.filter((slot) => !slot.specific_date) || [];
  const specificDateAvailability = availability?.filter((slot) => Boolean(slot.specific_date)) || [];
  const availableDays = weeklyAvailability
    .map((slot) => slot.day_of_week)
    .filter((day): day is number => typeof day === "number");
  const availableSpecificDates = new Set(
    specificDateAvailability
      .map((slot) => slot.specific_date)
      .filter((date): date is string => Boolean(date)),
  );
  const isDateDisabled = (date: Date) => {
    if (isBefore(date, new Date()) && !isToday(date)) return true;

    const dateKey = format(date, "yyyy-MM-dd");
    if (availableSpecificDates.has(dateKey)) {
      return false;
    }

    if (availableDays.length > 0) {
      return !availableDays.includes(date.getDay());
    }

    return availableSpecificDates.size > 0;
  };
  const availableSlots = slots;

  if (isLoading) return <AppLayout><div className="flex items-center justify-center py-20"><div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div></AppLayout>;
  if (!doctor) return <AppLayout><div className="text-center py-20"><h2 className="font-display font-bold text-xl mb-2">{t.doctorNotFound}</h2><Button variant="outline" onClick={() => navigate("/patient/doctors")}>{t.backToDoctors}</Button></div></AppLayout>;

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
          <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground hover:text-foreground" onClick={() => navigate("/patient/doctors")}><ArrowLeft className="mr-1 h-4 w-4" /> {t.backToDoctors}</Button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div className="lg:col-span-1 space-y-4" custom={1} variants={fadeUp}>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex flex-col items-center text-center">
                {(doctor.avatar_url || doctor.avatarUrl || doctor.profiles?.avatar_url) ? (
                  <img
                    src={doctor.avatar_url ?? doctor.avatarUrl ?? doctor.profiles?.avatar_url}
                    alt={profile.full_name}
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: "28px",
                      objectFit: "cover",
                      objectPosition: "top center",
                      marginBottom: "16px",
                      border: "2px solid #b5d1cc",
                    }}
                  />
                ) : (
                  <div className="h-[140px] w-[140px] rounded-[28px] bg-gradient-to-br from-primary to-info flex items-center justify-center mb-4">
                    <span className="text-primary-foreground font-display font-bold text-4xl">
                      {profile?.full_name?.[0] || "D"}
                    </span>
                  </div>
                )}
                <h1 className="text-xl font-display font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>Dr. {profile?.full_name || "Unknown"}</h1>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-[0.82rem] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <Icon style={{ width: 14, height: 14 }} />
                  {spec?.name || "General"}
                </span>
              </div>
            </div>
            {doctor.bio && (<div className="rounded-2xl border border-border bg-card p-6 shadow-soft"><h3 className="mb-2 flex items-center gap-2 font-display font-semibold text-foreground" style={{ fontFamily: "Manrope, sans-serif", fontWeight: 600 }}><FileText className="h-4 w-4 text-primary" /> {t.about}</h3><p className="text-sm text-muted-foreground">{doctor.bio}</p></div>)}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="mb-3 flex items-center gap-2 font-display font-semibold text-foreground" style={{ fontFamily: "Manrope, sans-serif", fontWeight: 600 }}><Clock className="h-4 w-4 text-primary" /> {t.weeklySchedule}</h3>
              <div className="space-y-2">
                {dayNames.map((day, idx) => {
                  const daySlots = weeklyAvailability.filter((a) => a.day_of_week === idx);
                  return (
                    <div key={day} className="flex items-center justify-between text-sm">
                      <span className={cn("font-medium", daySlots && daySlots.length > 0 ? "text-foreground" : "text-muted-foreground")} style={daySlots && daySlots.length > 0 ? { fontWeight: 600 } : undefined}>{day}</span>
                      {daySlots && daySlots.length > 0 ? <span className="text-[0.85rem] text-emerald-600 dark:text-emerald-300">{daySlots.map((s) => `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`).join(", ")}</span> : <span className="text-xs text-muted-foreground/70">{t.unavailable}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div className="lg:col-span-2 space-y-4" custom={2} variants={fadeUp}>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="mb-1 flex items-center gap-2 text-xl font-display font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700 }}><CalendarCheck className="h-5 w-5 text-primary" /> {t.bookAnAppointment}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{t.selectDateAndTime}</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">{t.selectDate}</h3>
                  <div className="calendar-wrapper">
                    <style>{`
                      .calendar-wrapper button.rdp-day_selected,
                      .calendar-wrapper button.rdp-day_selected:hover,
                      .calendar-wrapper button.rdp-day_selected:focus {
                        background-color: hsl(var(--primary)) !important;
                        color: hsl(var(--primary-foreground)) !important;
                        border-radius: 10px !important;
                      }
                      .calendar-wrapper button.rdp-day:not(.rdp-day_selected):hover {
                        background-color: hsl(var(--accent)) !important;
                        border-radius: 10px !important;
                      }
                    `}</style>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => { setSelectedDate(date); setSelectedSlot(null); }}
                      disabled={isDateDisabled}
                      fromDate={new Date()}
                      locale={locale}
                      className="pointer-events-auto w-full rounded-xl border border-border bg-background p-3"
                      classNames={{
                        months: "flex flex-col w-full",
                        month: "space-y-4 w-full",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex justify-between",
                        row: "flex w-full mt-2 justify-between",
                        head_cell: "text-muted-foreground rounded-md flex-1 text-center font-normal text-[0.8rem]",
                        cell: "flex-1 h-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                        day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 rounded-[10px]",
                        day_selected: "rounded-[10px] bg-primary text-primary-foreground",
                        day_today: "rounded-[10px] border border-primary/30 text-primary font-bold",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">{selectedDate ? `${t.availableSlots} - ${format(selectedDate, "EEE, MMM d", { locale })}` : t.selectDateFirst}</h3>
                  {selectedDate ? (availableSlots.length > 0 ? (<div className="grid grid-cols-3 gap-2">{availableSlots.map((slot) => (<button key={slot.startTime} onClick={() => setSelectedSlot(slot)} className={cn("rounded-[10px] border px-2 py-2 text-[0.85rem] font-medium transition-all", selectedSlot?.startTime === slot.startTime ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground hover:bg-accent")}>{slot.startTime}</button>))}</div>) : (<div className="py-8 text-center text-sm text-muted-foreground">{t.noSlotsAvailable}</div>)) : (<div className="py-8 text-center text-sm text-muted-foreground">{t.pickDate}</div>)}
                </div>
              </div>
            </div>

            {selectedSlot && selectedDate && (
              <motion.div className="rounded-2xl border border-border bg-card p-6 shadow-soft" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <h3 className="mb-3 font-display font-semibold text-foreground">{t.additionalNotes}</h3>
                <Textarea placeholder={t.symptomsPlaceholder} value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl mb-4" rows={3} />
                <div className="mb-4 rounded-2xl border border-border bg-background/70 p-6">
                  <h4 className="mb-2 text-sm font-semibold text-foreground">{t.bookingSummary}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">{t.doctor}</span><span className="font-medium text-foreground">Dr. {profile?.full_name}</span>
                    <span className="text-muted-foreground">{t.specialty}</span><span className="font-medium text-foreground">{spec?.name}</span>
                    <span className="text-muted-foreground">{t.date}</span><span className="font-medium text-foreground">{format(selectedDate, "EEEE, MMMM d, yyyy", { locale })}</span>
                    <span className="text-muted-foreground">{t.time}</span><span className="font-medium text-foreground">{selectedSlot.startTime} - {selectedSlot.endTime}</span>
                    <span className="text-muted-foreground">{t.fee}</span><span className="font-medium text-foreground">{doctor.consultation_fee ?? doctor.consultationFee ?? "-"}</span>
                  </div>
                </div>
                <Button className="h-11 w-full rounded-xl shadow-soft" onClick={() => bookMutation.mutate()} disabled={bookMutation.isPending}>
                  {bookMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.booking}</> : <><CalendarCheck className="mr-2 h-4 w-4" /> {t.confirmBooking}</>}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
