import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { ApiError, type BookableSlot } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, isBefore, isToday, endOfMonth, eachDayOfInterval, startOfMonth, parse } from "date-fns";
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

const BOOKING_UI_COPY = {
  en: {
    bookingGuide: "The weekly schedule is only a guide. Book only from the final time list below.",
    bookableSlots: "Bookable Times",
    loadingSlots: "Loading bookable times...",
    slotLoadFailed: "Could not load bookable times for this date.",
    expiredSlotsHidden: "Past times for today are hidden. Only remaining bookable times are shown.",
    noRemainingToday: "There are no remaining bookable times for today.",
    selectBookableTime: "Select a bookable time to continue.",
    expiredSlotError: "This time has already passed today. Pick a remaining time.",
    slotContractError: "The selected slot could not be verified. Please choose another time.",
    patientRecordError: "Your patient record could not be found. Contact the clinic before booking.",
    staleSlotError: "This time is no longer bookable. Please choose another available time.",
    raceSlotError: "That time was just taken. Please choose another available time.",
    unknownBookingError: "Booking could not be completed. Please try another available time.",
    missingPatientIdentity: "Your patient identity could not be resolved for booking.",
    timePending: "To be confirmed",
  },
  tr: {
    bookingGuide: "Haftalik program sadece on bilgidir. Kesin uygun saatler asagidaki listeden alinmalidir.",
    bookableSlots: "Alinabilir Saatler",
    loadingSlots: "Alinabilir saatler yukleniyor...",
    slotLoadFailed: "Bu tarih icin alinabilir saatler yuklenemedi.",
    expiredSlotsHidden: "Bugun icin gecmis saatler gizlendi. Yalnizca alinabilir saatler gosteriliyor.",
    noRemainingToday: "Bugun icin kalan alinabilir saat yok.",
    selectBookableTime: "Devam etmek icin alinabilir bir saat secin.",
    expiredSlotError: "Bu saat bugun icin artik gecti. Lutfen kalan bir saat secin.",
    slotContractError: "Secilen saat dogrulanamadi. Lutfen baska bir saat secin.",
    patientRecordError: "Hasta kaydiniz bulunamadi. Randevu almadan once klinikle iletisime gecin.",
    staleSlotError: "Bu saat artik alinabilir degil. Lutfen listeden baska bir saat secin.",
    raceSlotError: "Bu saat az once doldu. Lutfen baska bir saat secin.",
    unknownBookingError: "Randevu olusturulamadi. Lutfen baska bir saat deneyin.",
    missingPatientIdentity: "Randevu icin hasta kimligi cozumlenemedi.",
    timePending: "Dogrulanacak",
  },
} as const;

function parseTimeToMinutes(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }

  return (hours * 60) + minutes;
}

function addMinutesToTime(value: string, duration: number): string | null {
  const totalMinutes = parseTimeToMinutes(value);

  if (totalMinutes === null || !Number.isFinite(duration)) {
    return null;
  }

  const nextMinutes = totalMinutes + duration;
  const hours = String(Math.floor(nextMinutes / 60)).padStart(2, "0");
  const minutes = String(nextMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getDurationBetweenTimes(startTime: string, endTime: string | null): number | null {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null;
  }

  return endMinutes - startMinutes;
}

function isSlotExpiredForDate(date: Date, startTime: string, now: Date): boolean {
  if (!isToday(date)) {
    return false;
  }

  const slotStart = parse(startTime, "HH:mm", date);
  return !Number.isNaN(slotStart.getTime()) && slotStart <= now;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function resolvePatientBookingId(user: unknown): string | null {
  if (!user || typeof user !== "object") {
    return null;
  }

  const candidateUser = user as Record<string, unknown>;
  const nestedPatient =
    candidateUser.patient && typeof candidateUser.patient === "object"
      ? (candidateUser.patient as Record<string, unknown>)
      : null;
  const nestedProfile =
    candidateUser.profile && typeof candidateUser.profile === "object"
      ? (candidateUser.profile as Record<string, unknown>)
      : null;

  return (
    readString(candidateUser.patientId) ??
    readString(candidateUser.patient_id) ??
    readString(candidateUser.patientRecordId) ??
    readString(candidateUser.patient_record_id) ??
    readString(nestedPatient?.id) ??
    readString(nestedProfile?.patientId) ??
    readString(nestedProfile?.patient_id) ??
    readString(candidateUser.id)
  );
}

function mapBookingErrorMessage(error: unknown, lang: "en" | "tr") {
  const copy = BOOKING_UI_COPY[lang];
  const rawMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : null;

  switch (rawMessage) {
    case copy.expiredSlotError:
    case copy.slotContractError:
    case copy.patientRecordError:
    case copy.staleSlotError:
    case copy.raceSlotError:
    case copy.missingPatientIdentity:
      return rawMessage;
    case "Requested time is not bookable":
      return copy.staleSlotError;
    case "Doctor already has an appointment in this time range":
      return copy.raceSlotError;
    case "Patient record not found":
      return copy.patientRecordError;
    case "Appointment end time must be after start time":
      return copy.slotContractError;
    default:
      return rawMessage || copy.unknownBookingError;
  }
}

export default function DoctorProfile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const uiCopy = BOOKING_UI_COPY[lang];

  const dayNames = [t.sunday, t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday];

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [slots, setSlots] = useState<BookableSlot[]>([]);
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date());
  const [slotAvailabilityByDate, setSlotAvailabilityByDate] = useState<Record<string, boolean>>({});
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotLoadError, setSlotLoadError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

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
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setSlots([]);
    setVisibleMonth(new Date());
    setSlotAvailabilityByDate({});
    setSlotLoadError(null);
  }, [id]);

  useEffect(() => {
    if (!id || !selectedDate) {
      setSlots([]);
      setSelectedSlot(null);
      setSlotLoadError(null);
      setIsLoadingSlots(false);
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    let cancelled = false;
    setIsLoadingSlots(true);
    setSlotLoadError(null);

    void api.availability
      .getDoctorSlots(id, dateStr)
      .then((data) => {
        if (cancelled) {
          return;
        }

        setSlots(data);
        setSelectedSlot((current) =>
          current && data.some((slot) => slot.startTime === current) ? current : null,
        );
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setSlots([]);
        setSelectedSlot(null);
        setSlotLoadError(uiCopy.slotLoadFailed);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingSlots(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, selectedDate, uiCopy.slotLoadFailed]);

  const availableDays = useMemo(
    () => availability?.map((availabilitySlot: any) => availabilitySlot.day_of_week) || [],
    [availability],
  );

  useEffect(() => {
    if (!id || availableDays.length === 0) {
      setSlotAvailabilityByDate({});
      return;
    }

    const monthStart = startOfMonth(visibleMonth);
    const monthEnd = endOfMonth(visibleMonth);
    const today = new Date();
    const snapshotNow = new Date();
    const candidateDates = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(
      (date) =>
        !(isBefore(date, today) && !isToday(date)) &&
        availableDays.includes(date.getDay()),
    );

    if (candidateDates.length === 0) {
      setSlotAvailabilityByDate({});
      return;
    }

    let cancelled = false;

    void Promise.all(
      candidateDates.map(async (date) => {
        const dateStr = format(date, "yyyy-MM-dd");

        try {
          const daySlots = await api.availability.getDoctorSlots(id, dateStr);
          const hasBookableSlot = daySlots.some(
            (slot) => !isSlotExpiredForDate(date, slot.startTime, snapshotNow),
          );
          return [dateStr, hasBookableSlot] as const;
        } catch {
          return [dateStr, false] as const;
        }
      }),
    ).then((entries) => {
      if (!cancelled) {
        setSlotAvailabilityByDate(Object.fromEntries(entries));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [availableDays, id, visibleMonth]);

  useEffect(() => {
    if (!selectedDate) {
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    if (slotAvailabilityByDate[dateStr] === false) {
      setSelectedDate(undefined);
      setSelectedSlot(null);
      setSlots([]);
    }
  }, [selectedDate, slotAvailabilityByDate]);

  const slotOptions = useMemo(() => {
    return slots.map((slot) => {
      const fallbackAvailability = selectedDate
        ? availability?.find((availabilitySlot: any) => {
            if (availabilitySlot?.day_of_week !== selectedDate.getDay()) {
              return false;
            }

            if (availabilitySlot?.is_active === false) {
              return false;
            }

            const slotStartMinutes = parseTimeToMinutes(slot.startTime);
            const blockStartMinutes = parseTimeToMinutes(availabilitySlot?.start_time);
            const blockEndMinutes = parseTimeToMinutes(availabilitySlot?.end_time);
            const fallbackDuration =
              typeof availabilitySlot?.slot_duration === "number"
                ? availabilitySlot.slot_duration
                : Number(availabilitySlot?.slot_duration ?? 30);

            return (
              slotStartMinutes !== null &&
              blockStartMinutes !== null &&
              blockEndMinutes !== null &&
              Number.isFinite(fallbackDuration) &&
              slotStartMinutes >= blockStartMinutes &&
              slotStartMinutes + fallbackDuration <= blockEndMinutes
            );
          }) ??
          availability?.find(
            (availabilitySlot: any) =>
              availabilitySlot?.day_of_week === selectedDate.getDay() &&
              availabilitySlot?.is_active !== false,
          )
        : null;

      const fallbackDuration =
        typeof fallbackAvailability?.slot_duration === "number"
          ? fallbackAvailability.slot_duration
          : Number(fallbackAvailability?.slot_duration ?? 30);
      const durationFromShape =
        slot.slotDuration ?? getDurationBetweenTimes(slot.startTime, slot.endTime);
      const resolvedDuration =
        durationFromShape ??
        (Number.isFinite(fallbackDuration) && fallbackDuration > 0 ? fallbackDuration : 30);
      const resolvedEndTime = slot.endTime ?? addMinutesToTime(slot.startTime, resolvedDuration);
      const isExpiredSameDay = selectedDate
        ? isSlotExpiredForDate(selectedDate, slot.startTime, now)
        : false;

      return {
        ...slot,
        resolvedDuration,
        resolvedEndTime,
        isExpiredSameDay,
      };
    });
  }, [availability, now, selectedDate, slots]);

  const selectedSlotOption = useMemo(
    () => slotOptions.find((slot) => slot.startTime === selectedSlot) ?? null,
    [selectedSlot, slotOptions],
  );

  const bookableSlotOptions = useMemo(
    () => slotOptions.filter((slot) => !slot.isExpiredSameDay),
    [slotOptions],
  );

  const expiredSlotCount = slotOptions.length - bookableSlotOptions.length;

  useEffect(() => {
    if (selectedSlotOption && !selectedSlotOption.isExpiredSameDay) {
      return;
    }

    if (selectedSlot) {
      setSelectedSlot(null);
    }
  }, [selectedSlot, selectedSlotOption]);

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedDate || !selectedSlotOption || !id) {
        throw new Error(uiCopy.selectBookableTime);
      }

      if (selectedSlotOption.isExpiredSameDay) {
        throw new Error(uiCopy.expiredSlotError);
      }

      if (!selectedSlotOption.resolvedEndTime) {
        throw new Error(uiCopy.slotContractError);
      }

      const patientId = resolvePatientBookingId(user);

      if (!patientId) {
        throw new Error(uiCopy.missingPatientIdentity);
      }

      return api.appointments.create({
        patientId,
        doctorId: id,
        appointmentDate: format(selectedDate, "yyyy-MM-dd"),
        startTime: selectedSlotOption.startTime,
        endTime: selectedSlotOption.resolvedEndTime,
        notes: notes || null,
      });
    },
    onSuccess: () => {
      toast.success(t.bookingSuccess);
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      navigate("/patient/appointments");
    },
    onError: (error: unknown) => {
      const message = mapBookingErrorMessage(error, lang);
      toast.error(message || t.bookingFailed);

      if (message === uiCopy.staleSlotError || message === uiCopy.raceSlotError) {
        setSelectedSlot(null);

        if (id && selectedDate) {
          const dateStr = format(selectedDate, "yyyy-MM-dd");
          setIsLoadingSlots(true);
          setSlotLoadError(null);

          void api.availability.getDoctorSlots(id, dateStr)
            .then((data) => {
              setSlots(data);
            })
            .catch(() => {
              setSlots([]);
              setSlotLoadError(uiCopy.slotLoadFailed);
            })
            .finally(() => {
              setIsLoadingSlots(false);
            });
        }
      }
    },
  });

  const isDateDisabled = (date: Date) => {
    if (isBefore(date, new Date()) && !isToday(date)) return true;
    if (!availableDays.includes(date.getDay())) return true;

    const dateStr = format(date, "yyyy-MM-dd");
    return slotAvailabilityByDate[dateStr] !== true;
  };

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
                  const daySlots = availability?.filter((slot: any) => slot.day_of_week === idx);
                  return (
                    <div key={day} className="flex items-center justify-between text-sm">
                      <span className={cn("font-medium", daySlots && daySlots.length > 0 ? "text-foreground" : "text-muted-foreground")} style={daySlots && daySlots.length > 0 ? { color: "#1a2e3b", fontWeight: 600 } : { color: "#b5d1cc" }}>{day}</span>
                      {daySlots && daySlots.length > 0 ? <span className="text-muted-foreground" style={{ color: "#65a98f", fontSize: "0.85rem" }}>{daySlots.map((slot: any) => `${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`).join(", ")}</span> : <span className="text-muted-foreground/50 text-xs" style={{ color: "#b5d1cc", fontSize: "0.75rem" }}>{t.unavailable}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div className="lg:col-span-2 space-y-4" custom={2} variants={fadeUp}>
            <div style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(79,143,230,0.08)" }}>
              <h2 className="text-xl font-display font-bold mb-1 flex items-center gap-2" style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}><CalendarCheck style={{ color: "#4f8fe6", width: 20, height: 20 }} /> {t.bookAnAppointment}</h2>
              <p className="text-sm text-muted-foreground mb-6" style={{ color: "#5a7a8a", fontSize: "0.875rem", marginBottom: "24px" }}>{t.selectDateAndTime} {uiCopy.bookingGuide}</p>
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
                      month={visibleMonth}
                      onMonthChange={setVisibleMonth}
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
                  <h3 className="text-sm font-semibold mb-3" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.875rem", marginBottom: "12px" }}>{selectedDate ? `${uiCopy.bookableSlots} - ${format(selectedDate, "EEE, MMM d")}` : t.selectDateFirst}</h3>
                  {selectedDate && expiredSlotCount > 0 && (
                    <p className="mb-3 text-xs" style={{ color: "#5a7a8a" }}>
                      {uiCopy.expiredSlotsHidden}
                    </p>
                  )}
                  {selectedDate ? (
                    isLoadingSlots ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">{uiCopy.loadingSlots}</div>
                    ) : slotLoadError ? (
                      <div className="text-center py-8 text-sm" style={{ color: "#c65b5b" }}>{slotLoadError}</div>
                    ) : bookableSlotOptions.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {bookableSlotOptions.map((slot) => {
                          const isSelected = selectedSlot === slot.startTime;
                          const slotLabel = slot.resolvedEndTime
                            ? `${slot.startTime} - ${slot.resolvedEndTime}`
                            : slot.startTime;

                          return (
                            <button
                              key={`${slot.startTime}-${slot.resolvedEndTime ?? "open"}`}
                              onClick={() => setSelectedSlot(slot.startTime)}
                              style={{
                                padding: "8px",
                                borderRadius: "10px",
                                fontSize: "0.85rem",
                                fontWeight: 500,
                                border: `1.5px solid ${isSelected ? "#4f8fe6" : "#b5d1cc"}`,
                                background: isSelected ? "#eaf5ff" : "white",
                                color: isSelected ? "#4f8fe6" : "#1a2e3b",
                                cursor: "pointer",
                                transition: "all 0.15s",
                              }}
                            >
                              {slotLabel}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        {isToday(selectedDate) && slotOptions.length > 0 ? uiCopy.noRemainingToday : t.noSlotsAvailable}
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">{t.pickDate}</div>
                  )}
                </div>
              </div>
            </div>

            {selectedSlotOption && selectedDate && (
              <motion.div style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(79,143,230,0.08)" }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <h3 className="font-display font-semibold mb-3">{t.additionalNotes}</h3>
                <Textarea placeholder={t.symptomsPlaceholder} value={notes} onChange={(e) => setNotes(e.target.value)} className="rounded-xl mb-4" rows={3} />
                <div style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 12px rgba(79,143,230,0.08)", marginBottom: "16px" }}>
                  <h4 className="text-sm font-semibold mb-2">{t.bookingSummary}</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem" }}>{t.doctor}</span><span className="font-medium" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.875rem" }}>Dr. {profile?.full_name}</span>
                    <span className="text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem" }}>{t.specialty}</span><span className="font-medium" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.875rem" }}>{spec?.name}</span>
                    <span className="text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem" }}>{t.date}</span><span className="font-medium" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.875rem" }}>{format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                    <span className="text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem" }}>{t.time}</span><span className="font-medium" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.875rem" }}>{selectedSlotOption.startTime} - {selectedSlotOption.resolvedEndTime ?? uiCopy.timePending}</span>
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
