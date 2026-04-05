import { useEffect, useState } from "react";
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
import { format, addMinutes, parse, isBefore, isToday } from "date-fns";
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
          <Button variant="ghost" size="sm" className="mb-4" style={{ color: "#5a7a8a" }} onClick={() => navigate("/patient/doctors")}><ArrowLeft className="h-4 w-4 mr-1" /> {t.backToDoctors}</Button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div className="lg:col-span-1 space-y-4" custom={1} variants={fadeUp}>
            <div style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(79,143,230,0.08)" }}>
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
                <h1 className="text-xl font-display font-bold" style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>Dr. {profile?.full_name || "Unknown"}</h1>
                <span style={{ background: "#e6f4ef", color: "#65a98f", border: "1.5px solid #b5d1cc", borderRadius: "999px", padding: "4px 14px", fontSize: "0.82rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                  <Icon style={{ width: 14, height: 14 }} />
                  {spec?.name || "General"}
                </span>
              </div>
            </div>
            {doctor.bio && (<div style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(79,143,230,0.08)" }}><h3 className="font-display font-semibold mb-2 flex items-center gap-2" style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}><FileText style={{ color: "#4f8fe6", width: 16, height: 16 }} /> {t.about}</h3><p className="text-sm text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem" }}>{doctor.bio}</p></div>)}
            <div style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(79,143,230,0.08)" }}>
              <h3 className="font-display font-semibold mb-3 flex items-center gap-2" style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}><Clock style={{ color: "#4f8fe6", width: 16, height: 16 }} /> {t.weeklySchedule}</h3>
              <div className="space-y-2">
                {dayNames.map((day, idx) => {
                  const daySlots = availability?.filter((a) => a.day_of_week === idx);
                  return (
                    <div key={day} className="flex items-center justify-between text-sm">
                      <span className={cn("font-medium", daySlots && daySlots.length > 0 ? "text-foreground" : "text-muted-foreground")} style={daySlots && daySlots.length > 0 ? { color: "#1a2e3b", fontWeight: 600 } : { color: "#b5d1cc" }}>{day}</span>
                      {daySlots && daySlots.length > 0 ? <span className="text-muted-foreground" style={{ color: "#65a98f", fontSize: "0.85rem" }}>{daySlots.map((s) => `${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}`).join(", ")}</span> : <span className="text-muted-foreground/50 text-xs" style={{ color: "#b5d1cc", fontSize: "0.75rem" }}>{t.unavailable}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div className="lg:col-span-2 space-y-4" custom={2} variants={fadeUp}>
            <div style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(79,143,230,0.08)" }}>
              <h2 className="text-xl font-display font-bold mb-1 flex items-center gap-2" style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}><CalendarCheck style={{ color: "#4f8fe6", width: 20, height: 20 }} /> {t.bookAnAppointment}</h2>
              <p className="text-sm text-muted-foreground mb-6" style={{ color: "#5a7a8a", fontSize: "0.875rem", marginBottom: "24px" }}>{t.selectDateAndTime}</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.875rem", marginBottom: "12px" }}>{t.selectDate}</h3>
                  <div className="calendar-wrapper">
                    <style>{`
                      .calendar-wrapper button.rdp-day_selected,
                      .calendar-wrapper button.rdp-day_selected:hover,
                      .calendar-wrapper button.rdp-day_selected:focus {
                        background-color: #4f8fe6 !important;
                        color: white !important;
                        border-radius: 10px !important;
                      }
                      .calendar-wrapper button.rdp-day:not(.rdp-day_selected):hover {
                        background-color: #eaf5ff !important;
                        border-radius: 10px !important;
                      }
                    `}</style>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => { setSelectedDate(date); setSelectedSlot(null); }}
                      disabled={isDateDisabled}
                      fromDate={new Date()}
                      className="p-3 pointer-events-auto rounded-xl border w-full"
                      classNames={{
                        months: "flex flex-col w-full",
                        month: "space-y-4 w-full",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex justify-between",
                        row: "flex w-full mt-2 justify-between",
                        head_cell: "text-muted-foreground rounded-md flex-1 text-center font-normal text-[0.8rem]",
                        cell: "flex-1 h-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                        day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 rounded-[10px]",
                        day_selected: "bg-[#4f8fe6] text-white rounded-[10px]",
                        day_today: "border border-[#b5d1cc] text-[#4f8fe6] font-bold rounded-[10px]",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.875rem", marginBottom: "12px" }}>{selectedDate ? `${t.availableSlots} — ${format(selectedDate, "EEE, MMM d")}` : t.selectDateFirst}</h3>
                  {selectedDate ? (availableSlots.length > 0 ? (<div className="grid grid-cols-3 gap-2">{availableSlots.map((slot) => (<button key={slot} onClick={() => setSelectedSlot(slot)} style={{ padding: "8px", borderRadius: "10px", fontSize: "0.85rem", fontWeight: 500, border: `1.5px solid ${selectedSlot === slot ? "#4f8fe6" : "#b5d1cc"}`, background: selectedSlot === slot ? "#eaf5ff" : "white", color: selectedSlot === slot ? "#4f8fe6" : "#1a2e3b", cursor: "pointer", transition: "all 0.15s" }}>{slot}</button>))}</div>) : (<div className="text-center py-8 text-muted-foreground text-sm">{t.noSlotsAvailable}</div>)) : (<div className="text-center py-8 text-muted-foreground text-sm">{t.pickDate}</div>)}
                </div>
              </div>
            </div>

            {selectedSlot && selectedDate && (
              <motion.div style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(79,143,230,0.08)" }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <h3 className="font-display font-semibold mb-3">{t.additionalNotes}</h3>
                <Textarea placeholder={t.symptomsPlaceholder} value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl mb-4" rows={3} />
                <div style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(79,143,230,0.08)", marginBottom: "16px" }}>
                  <h4 className="text-sm font-semibold mb-2">{t.bookingSummary}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem" }}>{t.doctor}</span><span className="font-medium" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.875rem" }}>Dr. {profile?.full_name}</span>
                    <span className="text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem" }}>{t.specialty}</span><span className="font-medium" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.875rem" }}>{spec?.name}</span>
                    <span className="text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem" }}>{t.date}</span><span className="font-medium" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.875rem" }}>{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                    <span className="text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem" }}>{t.time}</span><span className="font-medium" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.875rem" }}>{selectedSlot} — {format(addMinutes(parse(selectedSlot, "HH:mm", new Date()), 30), "HH:mm")}</span>
                    <span className="text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem" }}>{t.fee}</span><span className="font-medium" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.875rem" }}>{doctor.consultation_fee ?? doctor.consultationFee ?? "-"}</span>
                  </div>
                </div>
                <Button className="w-full rounded-xl h-11 shadow-soft" style={{ background: "#4f8fe6", color: "white", borderRadius: "12px", height: "44px", width: "100%", fontWeight: 600, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }} onClick={() => bookMutation.mutate()} disabled={bookMutation.isPending}>
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
