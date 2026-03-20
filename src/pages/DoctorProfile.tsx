import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, addMinutes, parse, isBefore, isToday } from "date-fns";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Stethoscope, HeartPulse, Brain, Eye, Baby, Bone, ScanFace, Smile,
  Clock, DollarSign, Star, GraduationCap, FileText, CalendarCheck, Loader2, ArrowLeft,
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

function generateTimeSlots(startTime: string, endTime: string, intervalMin = 30): string[] {
  const slots: string[] = [];
  let current = parse(startTime, "HH:mm:ss", new Date());
  const end = parse(endTime, "HH:mm:ss", new Date());
  while (isBefore(current, end)) { slots.push(format(current, "HH:mm")); current = addMinutes(current, intervalMin); }
  return slots;
}

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

  const { data: existingAppointments } = useQuery({
    queryKey: ["doctor-appointments", id, selectedDate],
    queryFn: async () => {
      if (!selectedDate) return [];
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const data = await api.appointments.list({
        doctor_id: id!,
        date_from: dateStr,
        date_to: dateStr,
      });
      return data
        .filter((appointment: any) =>
          appointment.appointment_date === dateStr &&
          (appointment.status === "pending" || appointment.status === "confirmed"),
        )
        .map((appointment: any) => ({
          start_time: appointment.start_time,
          end_time: appointment.end_time,
        }));
    },
    enabled: !!id && !!selectedDate,
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedDate || !selectedSlot || !id) throw new Error("Missing data");
      const startTime = selectedSlot;
      const endParsed = addMinutes(parse(selectedSlot, "HH:mm", new Date()), 30);
      const endTime = format(endParsed, "HH:mm");
      return api.appointments.create({
        patientId: user.id,
        doctorId: id,
        appointmentDate: format(selectedDate, "yyyy-MM-dd"),
        startTime: startTime,
        endTime: endTime,
        notes: notes || null,
      });
    },
    onSuccess: () => { toast.success(t.bookingSuccess); queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] }); navigate("/patient/appointments"); },
    onError: (err: any) => toast.error(err.message || t.bookingFailed),
  });

  const availableDays = availability?.map((a) => a.day_of_week) || [];
  const isDateDisabled = (date: Date) => { if (isBefore(date, new Date()) && !isToday(date)) return true; return !availableDays.includes(date.getDay()); };
  const selectedDayAvailability = selectedDate ? availability?.filter((a) => a.day_of_week === selectedDate.getDay()) : [];
  const allSlots = selectedDayAvailability?.flatMap((a) => generateTimeSlots(a.start_time, a.end_time)) || [];
  const bookedSlots = existingAppointments?.map((a) => a.start_time.slice(0, 5)) || [];
  const availableSlots = allSlots.filter((s) => !bookedSlots.includes(s));

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
          <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate("/patient/doctors")}><ArrowLeft className="h-4 w-4 mr-1" /> {t.backToDoctors}</Button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div className="lg:col-span-1 space-y-4" custom={1} variants={fadeUp}>
            <div className="glass rounded-2xl p-6 shadow-card">
              <div className="flex flex-col items-center text-center">
                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-info flex items-center justify-center mb-4">
                  <span className="text-primary-foreground font-display font-bold text-3xl">{profile?.full_name?.[0] || "D"}</span>
                </div>
                <h1 className="text-xl font-display font-bold">Dr. {profile?.full_name || "Unknown"}</h1>
                <Badge variant="secondary" className="mt-2 rounded-full"><Icon className="h-3.5 w-3.5 mr-1" />{spec?.name || "General"}</Badge>
                <div className="grid grid-cols-3 gap-3 mt-6 w-full">
                  <div className="text-center p-3 rounded-xl bg-muted"><GraduationCap className="h-4 w-4 mx-auto mb-1 text-muted-foreground" /><div className="text-sm font-bold">{doctor.title || "-"}</div><div className="text-xs text-muted-foreground">{t.experience}</div></div>
                  <div className="text-center p-3 rounded-xl bg-muted"><Star className="h-4 w-4 mx-auto mb-1 fill-warning text-warning" /><div className="text-sm font-bold">4.8</div><div className="text-xs text-muted-foreground">{t.rating}</div></div>
                  <div className="text-center p-3 rounded-xl bg-muted"><DollarSign className="h-4 w-4 mx-auto mb-1 text-muted-foreground" /><div className="text-sm font-bold">{doctor.phone || "-"}</div><div className="text-xs text-muted-foreground">{t.fee}</div></div>
                </div>
              </div>
            </div>
            {doctor.bio && (<div className="glass rounded-2xl p-6 shadow-card"><h3 className="font-display font-semibold mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> {t.about}</h3><p className="text-sm text-muted-foreground">{doctor.bio}</p></div>)}
            <div className="glass rounded-2xl p-6 shadow-card">
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> {t.weeklySchedule}</h3>
              <div className="space-y-2">
                {dayNames.map((day, idx) => {
                  const daySlots = availability?.filter((a) => a.day_of_week === idx);
                  return (
                    <div key={day} className="flex items-center justify-between text-sm">
                      <span className={cn("font-medium", daySlots && daySlots.length > 0 ? "text-foreground" : "text-muted-foreground")}>{day}</span>
                      {daySlots && daySlots.length > 0 ? <span className="text-muted-foreground">{daySlots.map((s) => `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`).join(", ")}</span> : <span className="text-muted-foreground/50 text-xs">{t.unavailable}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div className="lg:col-span-2 space-y-4" custom={2} variants={fadeUp}>
            <div className="glass rounded-2xl p-6 shadow-card">
              <h2 className="text-xl font-display font-bold mb-1 flex items-center gap-2"><CalendarCheck className="h-5 w-5" /> {t.bookAnAppointment}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t.selectDateAndTime}</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3">{t.selectDate}</h3>
                  <Calendar mode="single" selected={selectedDate} onSelect={(date) => { setSelectedDate(date); setSelectedSlot(null); }} disabled={isDateDisabled} className={cn("p-3 pointer-events-auto rounded-xl border")} fromDate={new Date()} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3">{selectedDate ? `${t.availableSlots} — ${format(selectedDate, "EEE, MMM d")}` : t.selectDateFirst}</h3>
                  {selectedDate ? (availableSlots.length > 0 ? (<div className="grid grid-cols-3 gap-2">{availableSlots.map((slot) => (<Button key={slot} variant={selectedSlot === slot ? "default" : "outline"} size="sm" className="rounded-xl text-sm" onClick={() => setSelectedSlot(slot)}>{slot}</Button>))}</div>) : (<div className="text-center py-8 text-muted-foreground text-sm">{t.noSlotsAvailable}</div>)) : (<div className="text-center py-8 text-muted-foreground text-sm">{t.pickDate}</div>)}
                </div>
              </div>
            </div>

            {selectedSlot && selectedDate && (
              <motion.div className="glass rounded-2xl p-6 shadow-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <h3 className="font-display font-semibold mb-3">{t.additionalNotes}</h3>
                <Textarea placeholder={t.symptomsPlaceholder} value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl mb-4" rows={3} />
                <div className="glass rounded-xl p-4 mb-4">
                  <h4 className="text-sm font-semibold mb-2">{t.bookingSummary}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">{t.doctor}</span><span className="font-medium">Dr. {profile?.full_name}</span>
                    <span className="text-muted-foreground">{t.specialty}</span><span className="font-medium">{spec?.name}</span>
                    <span className="text-muted-foreground">{t.date}</span><span className="font-medium">{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                    <span className="text-muted-foreground">{t.time}</span><span className="font-medium">{selectedSlot} — {format(addMinutes(parse(selectedSlot, "HH:mm", new Date()), 30), "HH:mm")}</span>
                    <span className="text-muted-foreground">{t.fee}</span><span className="font-medium">{doctor.phone || "-"}</span>
                  </div>
                </div>
                <Button className="w-full rounded-xl h-11 shadow-soft" onClick={() => bookMutation.mutate()} disabled={bookMutation.isPending}>
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
