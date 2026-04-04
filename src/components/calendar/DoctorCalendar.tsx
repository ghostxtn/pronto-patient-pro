import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar as BigCalendar,
  Views,
  dateFnsLocalizer,
  type EventPropGetter,
  type ToolbarProps,
  type View,
} from "react-big-calendar";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  parse,
  setHours,
  setMinutes,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AppointmentDetailSheet } from "@/components/appointments/AppointmentDetailSheet";
import { AvailabilityModal } from "@/components/calendar/AvailabilityModal";
import { OverrideModal } from "@/components/calendar/OverrideModal";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as MiniCalendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import api from "@/services/api";
import type {
  Appointment,
  AvailabilityOverride,
  AvailabilitySlot,
  CalendarEvent,
} from "@/types/calendar";
import {
  appointmentsToEvents,
  getClinicNowParts,
  isPastSchedulerSelection,
  overridesToEvents,
  parseCalendarDate,
} from "@/utils/calendarUtils";

const locales = { tr };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1, locale: tr }),
  getDay,
  locales,
});

const calendarMessages = {
  today: "Bugun",
  previous: "Geri",
  next: "Ileri",
  month: "Ay",
  week: "Hafta",
  day: "Gun",
  agenda: "Ajanda",
  date: "Tarih",
  time: "Saat",
  event: "Etkinlik",
  noEventsInRange: "Bu gorunumde kayit bulunmuyor",
  showMore: (total: number) => `+${total} daha`,
};

type SchedulerVariant = "doctor" | "staff";
type QuickComposerMode = "appointment" | "blackout" | "custom_hours";

interface DoctorCalendarProps {
  doctorId: string;
  variant?: SchedulerVariant;
  doctorName?: string;
  doctorSubtitle?: string;
}

interface CalendarAppointmentResponse {
  id: string;
  doctor_id: string;
  patient_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  type?: string;
  notes?: string;
  patient?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email?: string;
    phone?: string;
  };
}

interface SchedulerSelection {
  date: string;
  startTime: string;
  endTime: string;
  startsAt: Date;
  endsAt: Date;
}

interface SchedulerQuickComposerProps {
  open: boolean;
  doctorId: string;
  doctorName?: string;
  selection: SchedulerSelection | null;
  availableSlotStarts?: string[];
  appointmentDurationMinutes?: number;
  invalidSelectionReason?: string | null;
  initialMode?: QuickComposerMode;
  onClose: () => void;
  onSaved: () => void;
}

interface SchedulerPatientRecord {
  id: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  tc_no?: string;
  tcNo?: string;
}

interface MonthActionPanelProps {
  date: Date;
  events: CalendarEvent[];
  disableActions?: boolean;
  onOpenAction: (mode: QuickComposerMode) => void;
  onOpenDayView: () => void;
}

interface CustomToolbarProps extends ToolbarProps<CalendarEvent, object> {
  anchorDate: Date;
  visibleRangeLabel: string;
  onGoToToday: () => void;
  onNavigateAction: (action: "PREV" | "NEXT") => void;
  onManageAvailability: () => void;
}

interface CalendarHeaderProps {
  date: Date;
  label: string;
  anchorDate: Date;
}

const toolbarViews = [Views.DAY, Views.WEEK, Views.MONTH] as const;

const toolbarViewLabels = {
  [Views.DAY]: "Gun",
  [Views.WEEK]: "Hafta",
  [Views.MONTH]: "Ay",
} as const;

const dayLabels: Record<number, string> = {
  0: "Pazar",
  1: "Pazartesi",
  2: "Sali",
  3: "Carsamba",
  4: "Persembe",
  5: "Cuma",
  6: "Cumartesi",
};

function toApiDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function getDateRange(date: Date, view: View) {
  switch (view) {
    case Views.MONTH:
      return { rangeStart: startOfMonth(date), rangeEnd: endOfMonth(date) };
    case Views.WEEK:
      return {
        rangeStart: startOfWeek(date, { weekStartsOn: 1, locale: tr }),
        rangeEnd: endOfWeek(date, { weekStartsOn: 1, locale: tr }),
      };
    case Views.DAY:
      return { rangeStart: date, rangeEnd: date };
    default:
      return {
        rangeStart: startOfWeek(date, { weekStartsOn: 1, locale: tr }),
        rangeEnd: endOfWeek(date, { weekStartsOn: 1, locale: tr }),
      };
  }
}

function getVisibleRangeLabel(anchorDate: Date, view: View) {
  if (view === Views.MONTH) return format(anchorDate, "LLLL yyyy", { locale: tr });
  if (view === Views.DAY) return format(anchorDate, "d MMMM yyyy, EEEE", { locale: tr });

  const start = startOfWeek(anchorDate, { weekStartsOn: 1, locale: tr });
  const end = endOfWeek(anchorDate, { weekStartsOn: 1, locale: tr });
  if (isSameMonth(start, end)) {
    return `${format(start, "d", { locale: tr })} - ${format(end, "d MMMM yyyy", { locale: tr })}`;
  }
  return `${format(start, "d MMM", { locale: tr })} - ${format(end, "d MMM yyyy", { locale: tr })}`;
}

function navigateAnchorDate(currentDate: Date, view: View, action: "PREV" | "NEXT") {
  const direction = action === "NEXT" ? 1 : -1;
  switch (view) {
    case Views.MONTH:
      return direction > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    case Views.WEEK:
      return direction > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
    case Views.DAY:
    default:
      return direction > 0 ? addDays(currentDate, 1) : subDays(currentDate, 1);
  }
}

function formatTimeRange(startTime: string, endTime: string) {
  return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
}

function getAvailabilitySortValue(slot: AvailabilitySlot) {
  const normalizedDay = slot.day_of_week === 0 ? 7 : slot.day_of_week;
  return normalizedDay * 10000 + Number(slot.start_time.slice(0, 2)) * 100 + Number(slot.start_time.slice(3, 5));
}

function getOverrideBadge(type: AvailabilityOverride["type"]) {
  return type === "blackout"
    ? { label: "Blok", className: "border-red-200 bg-red-50 text-red-700" }
    : { label: "Ozel Saat", className: "border-amber-200 bg-amber-50 text-amber-700" };
}

function toTimeString(date: Date) {
  return format(date, "HH:mm");
}

function toDateTime(date: string, time: string) {
  return parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
}

function buildSchedulerSelection(date: string, startTime: string, endTime: string): SchedulerSelection {
  return {
    date,
    startTime,
    endTime,
    startsAt: toDateTime(date, startTime),
    endsAt: toDateTime(date, endTime),
  };
}

function getPatientDisplayName(patient: SchedulerPatientRecord) {
  return (
    patient.fullName ||
    `${patient.first_name ?? patient.firstName ?? ""} ${patient.last_name ?? patient.lastName ?? ""}`.trim() ||
    patient.email ||
    patient.phone ||
    "Hasta"
  );
}

function getPatientSearchValue(patient: SchedulerPatientRecord) {
  return [
    getPatientDisplayName(patient),
    patient.email,
    patient.phone,
    patient.tc_no,
    patient.tcNo,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("tr");
}

function getDefaultSelectionForDate(date: Date, availabilitySlots: AvailabilitySlot[]) {
  const dateString = format(date, "yyyy-MM-dd");
  const activeSlots = availabilitySlots
    .filter((slot) => slot.is_active !== false && slot.day_of_week === date.getDay())
    .sort((left, right) => getAvailabilitySortValue(left) - getAvailabilitySortValue(right));

  if (activeSlots.length > 0) {
    const firstSlot = activeSlots[0];
    const startTime = firstSlot.start_time.slice(0, 5);
    const slotStart = toDateTime(dateString, startTime);
    const slotEndMinutes = Math.min(
      Number(firstSlot.end_time.slice(0, 2)) * 60 + Number(firstSlot.end_time.slice(3, 5)),
      Number(startTime.slice(0, 2)) * 60 + Number(startTime.slice(3, 5)) + firstSlot.slot_duration,
    );
    const endTime = `${String(Math.floor(slotEndMinutes / 60)).padStart(2, "0")}:${String(slotEndMinutes % 60).padStart(2, "0")}`;

    return {
      selection: buildSchedulerSelection(dateString, startTime, endTime),
      hasAvailabilityTemplate: true,
      isDefaultFromTemplate: true,
      startsAt: slotStart,
    };
  }

  return {
    selection: buildSchedulerSelection(dateString, "09:00", "09:30"),
    hasAvailabilityTemplate: false,
    isDefaultFromTemplate: false,
    startsAt: toDateTime(dateString, "09:00"),
  };
}

function isSelectionPast(selection: SchedulerSelection) {
  return isPastSchedulerSelection(selection.date, selection.startTime);
}

function getSlotDurationForStart(
  date: string,
  startTime: string,
  availabilitySlots: AvailabilitySlot[],
) {
  const parsedDate = parseCalendarDate(date);
  const matchingSlot = availabilitySlots.find((slot) => {
    if (slot.is_active === false || slot.day_of_week !== parsedDate.getDay()) {
      return false;
    }

    return startTime >= slot.start_time.slice(0, 5) && startTime < slot.end_time.slice(0, 5);
  });

  return matchingSlot?.slot_duration ?? availabilitySlots.find((slot) => slot.is_active !== false)?.slot_duration ?? 30;
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
}

async function onInvalidateSchedulerQueries(queryClient: ReturnType<typeof useQueryClient>, doctorId: string) {
  await queryClient.invalidateQueries({ queryKey: ["doctor-calendar", doctorId] });
  await queryClient.invalidateQueries({ queryKey: ["availability-overrides", doctorId] });
  await queryClient.invalidateQueries({ queryKey: ["availability", doctorId] });
  await queryClient.invalidateQueries({ queryKey: ["doctor-appointments-list"] });
  await queryClient.invalidateQueries({ queryKey: ["staff-dashboard"] });
  await queryClient.invalidateQueries({ queryKey: ["appointments"] });
}

function CalendarHeader({ date, label, anchorDate }: CalendarHeaderProps) {
  const isAnchor = isSameDay(date, anchorDate);

  return (
    <div className="flex justify-center py-1">
      <span
        className={[
          "inline-flex min-h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-medium transition-colors",
          isAnchor ? "bg-primary text-primary-foreground shadow-soft" : "text-slate-600",
        ].join(" ")}
      >
        {label}
      </span>
    </div>
  );
}

function CustomToolbar({
  anchorDate,
  visibleRangeLabel,
  onGoToToday,
  onNavigateAction,
  onView,
  view,
  onManageAvailability,
}: CustomToolbarProps) {
  return (
    <div className="mb-5 flex flex-col gap-4 rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(248,251,255,0.96),rgba(255,255,255,0.98))] px-4 pb-4 pt-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.26)] lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl border-slate-200 bg-white px-4 text-slate-700 shadow-none"
          onClick={onGoToToday}
        >
          Bugun
        </Button>
        <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-none">
          <button
            type="button"
            onClick={() => onNavigateAction("PREV")}
            className="rounded-l-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-50"
            aria-label="Onceki"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigateAction("NEXT")}
            className="rounded-r-xl p-2.5 text-slate-500 transition-colors hover:bg-slate-50"
            aria-label="Sonraki"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div>
          <div className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{visibleRangeLabel}</div>
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
            {format(anchorDate, "d MMMM yyyy", { locale: tr })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl border-slate-200 bg-white px-4 shadow-none"
          onClick={onManageAvailability}
        >
          <Settings2 className="mr-2 h-4 w-4" />
          Haftalik Musaitlik
        </Button>
        <div className="flex rounded-2xl bg-slate-100 p-1">
          {toolbarViews.map((toolbarView) => (
            <button
              key={toolbarView}
              type="button"
              onClick={() => onView(toolbarView)}
              className={[
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                view === toolbarView
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-800",
              ].join(" ")}
            >
              {toolbarViewLabels[toolbarView]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MonthActionPanel({ date, events, disableActions = false, onOpenAction, onOpenDayView }: MonthActionPanelProps) {
  const actionableEvents = events.filter((event) => isSameDay(event.start, date));

  return (
    <div className="absolute bottom-6 right-6 z-20 hidden w-[320px] rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-[0_24px_48px_-26px_rgba(15,23,42,0.35)] backdrop-blur xl:block">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xl font-semibold tracking-[-0.02em] text-slate-950">
            {format(date, "d MMMM, EEEE", { locale: tr })}
          </div>
          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
            {actionableEvents.length} operasyon kaydi
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenDayView}
          className="rounded-full px-3 py-1 text-xs font-medium text-primary transition-colors hover:bg-blue-50"
        >
          Gun gorunumu
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {actionableEvents.length > 0 ? (
          actionableEvents.slice(0, 3).map((event) => (
            <div key={event.id} className="rounded-2xl bg-slate-50 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">{event.title || "Kayit"}</div>
              <div className="mt-1 text-xs text-slate-500">
                {event.allDay ? "Tam gun" : `${format(event.start, "HH:mm")} - ${format(event.end, "HH:mm")}`}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
            Secili gunde takvim kaydi bulunmuyor. Hemen randevu, blok veya ozel saat olusturabilirsiniz.
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Button type="button" variant="outline" className="rounded-xl" disabled={disableActions} onClick={() => onOpenAction("appointment")}>
          Randevu
        </Button>
        <Button type="button" variant="outline" className="rounded-xl" disabled={disableActions} onClick={() => onOpenAction("blackout")}>
          Blok
        </Button>
        <Button type="button" variant="outline" className="rounded-xl" disabled={disableActions} onClick={() => onOpenAction("custom_hours")}>
          Ozel Saat
        </Button>
      </div>
    </div>
  );
}

function SchedulerQuickComposer({
  open,
  doctorId,
  doctorName,
  selection,
  availableSlotStarts = [],
  appointmentDurationMinutes = 30,
  invalidSelectionReason = null,
  initialMode = "appointment",
  onClose,
  onSaved,
}: SchedulerQuickComposerProps) {
  const queryClient = useQueryClient();
  const composerRef = useRef<HTMLDivElement | null>(null);
  const patientSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<QuickComposerMode>(initialMode);
  const [patientId, setPatientId] = useState("");
  const [patientQuery, setPatientQuery] = useState("");
  const [isManualPatient, setIsManualPatient] = useState(false);
  const [manualPatientFirstName, setManualPatientFirstName] = useState("");
  const [manualPatientLastName, setManualPatientLastName] = useState("");
  const [manualPatientPhone, setManualPatientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isAllDayBlackout, setIsAllDayBlackout] = useState(false);

  useEffect(() => {
    if (!open || !selection) {
      return;
    }

    setMode(initialMode);
    setPatientId("");
    setPatientQuery("");
    setIsManualPatient(false);
    setManualPatientFirstName("");
    setManualPatientLastName("");
    setManualPatientPhone("");
    setNotes("");
    setReason("");
    setStartTime(selection.startTime);
    setEndTime(selection.endTime);
    setIsAllDayBlackout(false);
  }, [initialMode, open, selection]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (composerRef.current && !composerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && mode === "appointment" && !isManualPatient) {
      patientSearchInputRef.current?.focus();
    }
  }, [isManualPatient, mode, open]);

  const { data: patients = [] } = useQuery({
    queryKey: ["scheduler-quick-composer-patients"],
    queryFn: async () => {
      const response = await api.patients.list({ limit: 0 });
      return (Array.isArray(response) ? response : response.data ?? []) as SchedulerPatientRecord[];
    },
    enabled: open && mode === "appointment",
  });

  const filteredPatients = useMemo(() => {
    const query = patientQuery.trim().toLocaleLowerCase("tr");
    if (!query) {
      return patients.slice(0, 8);
    }

    return patients
      .filter((patient) => getPatientSearchValue(patient).includes(query))
      .slice(0, 8);
  }, [patientQuery, patients]);

  const createPatientMutation = useMutation({
    mutationFn: async () =>
      api.patients.create({
        firstName: manualPatientFirstName.trim(),
        lastName: manualPatientLastName.trim(),
        phone: manualPatientPhone.trim() || undefined,
      }),
  });

  const appointmentMutation = useMutation({
    mutationFn: async () => {
      const resolvedPatientId = isManualPatient
        ? ((await createPatientMutation.mutateAsync()) as SchedulerPatientRecord).id
        : patientId;

      return api.appointments.create({
        patientId: resolvedPatientId,
        doctorId,
        appointmentDate: selection!.date,
        startTime,
        endTime,
        notes: notes.trim() || null,
      });
    },
    onSuccess: async () => {
      toast.success("Randevu taslagi kaydedildi");
      await onInvalidateSchedulerQueries(queryClient, doctorId);
      onSaved();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Randevu olusturulamadi");
    },
  });

  const overrideMutation = useMutation({
    mutationFn: async () =>
      api.availabilityOverrides.create({
        doctor_id: doctorId,
        date: selection!.date,
        type: mode === "blackout" ? "blackout" : "custom_hours",
        start_time:
          mode === "custom_hours" || (mode === "blackout" && !isAllDayBlackout)
            ? startTime
            : undefined,
        end_time:
          mode === "custom_hours" || (mode === "blackout" && !isAllDayBlackout)
            ? endTime
            : undefined,
        reason: reason.trim() || undefined,
      }),
    onSuccess: async () => {
      toast.success(
        mode === "blackout"
          ? isAllDayBlackout
            ? "Tam gun blok olusturuldu"
            : "Saat aralikli blok olusturuldu"
          : "Ozel saat olusturuldu",
      );
      await onInvalidateSchedulerQueries(queryClient, doctorId);
      onSaved();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Gunluk aksiyon kaydedilemedi");
    },
  });

  if (!open || !selection) {
    return null;
  }

  const isAppointmentSlotValid =
    availableSlotStarts.includes(startTime) &&
    endTime === addMinutesToTime(startTime, appointmentDurationMinutes);
  const appointmentInvalidReason =
    invalidSelectionReason ??
    (!availableSlotStarts.includes(startTime)
      ? "Bu hucre secili doktor icin gecerli bir musait slot degil."
      : endTime !== addMinutesToTime(startTime, appointmentDurationMinutes)
        ? "Randevu saati secili musait slot uzunluguyla ayni olmali."
        : null);

  const isAppointmentValid = Boolean(
    isAppointmentSlotValid &&
      (isManualPatient
        ? manualPatientFirstName.trim() && manualPatientLastName.trim()
        : patientId),
  );
  const isOverrideValid =
    mode === "blackout"
      ? isAllDayBlackout || Boolean(startTime && endTime && endTime > startTime)
      : Boolean(startTime && endTime && endTime > startTime);
  const isSubmitting =
    appointmentMutation.isPending ||
    overrideMutation.isPending ||
    createPatientMutation.isPending;

  const handleSubmit = () => {
    if (mode === "appointment") {
      if (!isAppointmentValid) {
        toast.error(appointmentInvalidReason ?? "Hasta bilgisi ile gecerli bir musait slot zorunludur");
        return;
      }
      appointmentMutation.mutate();
      return;
    }

    if (!isOverrideValid) {
      toast.error("Gunluk istisna icin gecerli saat araligi gerekir");
      return;
    }

    overrideMutation.mutate();
  };

  return (
    <div className="pointer-events-none absolute right-6 top-24 z-30 flex w-full max-w-[420px] justify-end">
      <div
        ref={composerRef}
        className="pointer-events-auto w-full rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(248,251,255,0.98),rgba(255,255,255,1))] p-5 shadow-[0_30px_60px_-28px_rgba(15,23,42,0.38)] backdrop-blur"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Hizli Olusturma
            </div>
            <h3 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-slate-950">
              {format(parse(selection.date, "yyyy-MM-dd", new Date()), "d MMMM yyyy, EEEE", {
                locale: tr,
              })}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {startTime} - {endTime}
              {doctorName ? ` · ${doctorName}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1">
          {[
            { value: "appointment" as const, label: "Randevu" },
            { value: "blackout" as const, label: "Blok" },
            { value: "custom_hours" as const, label: "Ozel Saat" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              className={[
                "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                mode === option.value
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/70",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4">
          {mode === "appointment" ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <Label>Hasta</Label>
                  <button
                    type="button"
                    className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
                    onClick={() => {
                      setIsManualPatient((current) => !current);
                      setPatientId("");
                      setPatientQuery("");
                    }}
                  >
                    {isManualPatient ? "Kayitli hasta ara" : "Manuel hasta gir"}
                  </button>
                </div>
                {isManualPatient ? (
                  <div className="grid grid-cols-2 gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-3">
                    <div className="space-y-2">
                      <Label>Ad</Label>
                      <Input
                        value={manualPatientFirstName}
                        onChange={(event) => setManualPatientFirstName(event.target.value)}
                        className="rounded-2xl border-slate-200 bg-white"
                        placeholder="Ayse"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Soyad</Label>
                      <Input
                        value={manualPatientLastName}
                        onChange={(event) => setManualPatientLastName(event.target.value)}
                        className="rounded-2xl border-slate-200 bg-white"
                        placeholder="Yilmaz"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Telefon</Label>
                      <Input
                        value={manualPatientPhone}
                        onChange={(event) => setManualPatientPhone(event.target.value)}
                        className="rounded-2xl border-slate-200 bg-white"
                        placeholder="Opsiyonel"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-3">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        ref={patientSearchInputRef}
                        value={patientQuery}
                        onChange={(event) => setPatientQuery(event.target.value)}
                        className="rounded-2xl border-slate-200 bg-white pl-9"
                        placeholder="Hasta ara: ad, telefon, kimlik"
                      />
                    </div>
                    <div className="mt-3 max-h-44 space-y-2 overflow-y-auto">
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => {
                          const isSelected = patient.id === patientId;
                          return (
                            <button
                              key={patient.id}
                              type="button"
                              onClick={() => setPatientId(patient.id)}
                              className={cn(
                                "flex w-full items-start justify-between rounded-2xl border px-3 py-2 text-left transition-colors",
                                isSelected
                                  ? "border-primary bg-blue-50 text-slate-900"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                              )}
                            >
                              <div>
                                <div className="text-sm font-medium">{getPatientDisplayName(patient)}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {[patient.phone, patient.email].filter(Boolean).join(" · ") || "Kayitli hasta"}
                                </div>
                              </div>
                              {isSelected ? (
                                <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                                  Secili
                                </span>
                              ) : null}
                            </button>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-500">
                          Bu arama ile eslesen kayitli hasta bulunamadi.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Baslangic</Label>
                  <Input type="time" value={startTime} readOnly disabled className="rounded-2xl border-slate-200 bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label>Bitis</Label>
                  <Input type="time" value={endTime} readOnly disabled className="rounded-2xl border-slate-200 bg-slate-50" />
                </div>
              </div>
              <div
                className={cn(
                  "rounded-2xl border px-3 py-3 text-sm",
                  appointmentInvalidReason
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700",
                )}
              >
                {appointmentInvalidReason
                  ? appointmentInvalidReason
                  : "Randevu yalnizca gercek musait slot uzerinden olusturulur."}
              </div>
              <div className="space-y-2">
                <Label>Not</Label>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="min-h-[88px] rounded-2xl border-slate-200 bg-slate-50"
                  placeholder="Kisa operasyon notu"
                />
              </div>
            </>
          ) : (
            <>
              {mode === "custom_hours" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Baslangic</Label>
                    <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="rounded-2xl border-slate-200 bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bitis</Label>
                    <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="rounded-2xl border-slate-200 bg-slate-50" />
                  </div>
                </div>
              ) : isAllDayBlackout ? (
                <div className="rounded-2xl border border-red-100 bg-red-50/70 p-3 text-sm text-red-700">
                  Bu blok secili tarih icin acikca tam gun olarak kaydedilecek.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Baslangic</Label>
                    <Input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="rounded-2xl border-slate-200 bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bitis</Label>
                    <Input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="rounded-2xl border-slate-200 bg-slate-50" />
                  </div>
                </div>
              )}
              {mode === "blackout" ? (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-slate-800">Tam gun blok</div>
                    <div className="text-xs text-slate-500">Secili araligi koru veya acikca tum gun kilitle.</div>
                  </div>
                  <Switch checked={isAllDayBlackout} onCheckedChange={setIsAllDayBlackout} />
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Sebep</Label>
                <Input
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="rounded-2xl border-slate-200 bg-slate-50"
                  placeholder={mode === "blackout" ? "Orn. ameliyat, izin" : "Orn. ozel calisma saati"}
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-500">
            Haftalik musaitlik ayari ayri yonetim panelindedir.
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" className="rounded-full px-4" onClick={onClose}>
              Vazgec
            </Button>
            <Button type="button" className="rounded-full px-5" disabled={isSubmitting} onClick={handleSubmit}>
              <Plus className="mr-2 h-4 w-4" />
              Kaydet
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DoctorCalendar({
  doctorId,
  variant = "doctor",
  doctorName,
  doctorSubtitle,
}: DoctorCalendarProps) {
  const queryClient = useQueryClient();
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [view, setView] = useState<View>(Views.WEEK);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [availabilityModal, setAvailabilityModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    slot?: AvailabilitySlot;
  }>({ open: false, mode: "create" });
  const [overrideModal, setOverrideModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    initialDate?: string;
    initialType?: "blackout" | "custom_hours";
    override?: AvailabilityOverride;
  }>({ open: false, mode: "create" });
  const [isAvailabilitySheetOpen, setIsAvailabilitySheetOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<AvailabilitySlot | null>(null);
  const [overrideToDelete, setOverrideToDelete] = useState<AvailabilityOverride | null>(null);
  const [quickComposerSelection, setQuickComposerSelection] = useState<SchedulerSelection | null>(null);
  const [isQuickComposerOpen, setIsQuickComposerOpen] = useState(false);
  const [quickComposerMode, setQuickComposerMode] = useState<QuickComposerMode>("appointment");

  const { rangeStart, rangeEnd } = useMemo(() => getDateRange(anchorDate, view), [anchorDate, view]);
  const visibleRangeLabel = useMemo(() => getVisibleRangeLabel(anchorDate, view), [anchorDate, view]);
  const overrideRangeStart = useMemo(() => format(subDays(anchorDate, 45), "yyyy-MM-dd"), [anchorDate]);
  const overrideRangeEnd = useMemo(() => format(addDays(anchorDate, 365), "yyyy-MM-dd"), [anchorDate]);

  const {
    data: availabilitySlots = [],
    isLoading: isAvailabilityLoading,
    isError: isAvailabilityError,
    error: availabilityError,
  } = useQuery({
    queryKey: ["availability", doctorId],
    queryFn: async () => api.availability.listByDoctor(doctorId) as Promise<AvailabilitySlot[]>,
    enabled: Boolean(doctorId),
  });

  const {
    data,
    isLoading: isCalendarLoading,
    isError: isCalendarError,
    error: calendarError,
  } = useQuery({
    queryKey: ["doctor-calendar", doctorId, toApiDate(rangeStart), toApiDate(rangeEnd), view],
    queryFn: async () => {
      const [overrides, appointments] = await Promise.all([
        api.availabilityOverrides.listByDoctor(
          doctorId,
          toApiDate(rangeStart),
          toApiDate(rangeEnd),
        ) as Promise<AvailabilityOverride[]>,
        api.appointments.list({
          doctor_id: doctorId,
          date_from: toApiDate(rangeStart),
          date_to: toApiDate(rangeEnd),
        }) as Promise<CalendarAppointmentResponse[]>,
      ]);

      const normalizedAppointments: Appointment[] = appointments.map((appointment) => ({
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
          id: appointment.patient?.id ?? "",
          firstName: appointment.patient?.firstName ?? "",
          lastName: appointment.patient?.lastName ?? "",
          fullName: appointment.patient?.fullName,
          email: appointment.patient?.email,
          phone: appointment.patient?.phone,
        },
      }));

      return {
        overrides,
        appointments: normalizedAppointments,
      };
    },
    enabled: Boolean(doctorId),
  });

  const { data: bookableSlotMap = {}, isFetching: isBookableSlotsFetching } = useQuery({
    queryKey: ["doctor-bookable-slots", doctorId, toApiDate(rangeStart), toApiDate(rangeEnd), view],
    queryFn: async () => {
      const dates = eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map((date) =>
        format(date, "yyyy-MM-dd"),
      );

      const entries = await Promise.all(
        dates.map(async (date) => {
          const slots = await api.availability.getDoctorSlots(doctorId, date);
          return [date, slots] as const;
        }),
      );

      return Object.fromEntries(entries) as Record<string, string[]>;
    },
    enabled: Boolean(doctorId),
  });

  const { data: overrideList = [], isLoading: isOverrideListLoading } = useQuery({
    queryKey: ["availability-overrides", doctorId, overrideRangeStart, overrideRangeEnd],
    queryFn: async () =>
      api.availabilityOverrides.listByDoctor(
        doctorId,
        overrideRangeStart,
        overrideRangeEnd,
      ) as Promise<AvailabilityOverride[]>,
    enabled: Boolean(doctorId),
  });

  const removeAvailability = useMutation({
    mutationFn: async (slotId: string) => api.availability.remove(slotId),
    onSuccess: async () => {
      toast.success("Haftalik musaitlik silindi");
      setSlotToDelete(null);
      await onInvalidateSchedulerQueries(queryClient, doctorId);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Musaitlik silinemedi");
    },
  });

  const removeOverride = useMutation({
    mutationFn: async (overrideId: string) => api.availabilityOverrides.remove(overrideId),
    onSuccess: async () => {
      toast.success("Tarih bazli istisna silindi");
      setOverrideToDelete(null);
      await onInvalidateSchedulerQueries(queryClient, doctorId);
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Istisna silinemedi");
    },
  });

  const events = useMemo(() => {
    if (!data) {
      return [];
    }

    return [...overridesToEvents(data.overrides), ...appointmentsToEvents(data.appointments)];
  }, [data]);

  const sortedAvailabilitySlots = useMemo(
    () =>
      [...availabilitySlots].sort(
        (left, right) => getAvailabilitySortValue(left) - getAvailabilitySortValue(right),
      ),
    [availabilitySlots],
  );

  const sortedOverrides = useMemo(
    () =>
      [...overrideList].sort(
        (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
      ),
    [overrideList],
  );

  const monthPanelEvents = useMemo(
    () => events.filter((event) => isSameDay(event.start, anchorDate)),
    [anchorDate, events],
  );
  const activeSelectionSlotStarts = useMemo(
    () => (quickComposerSelection ? bookableSlotMap[quickComposerSelection.date] ?? [] : []),
    [bookableSlotMap, quickComposerSelection],
  );
  const hasActiveSelectionSlotMap = useMemo(
    () =>
      quickComposerSelection
        ? Object.prototype.hasOwnProperty.call(bookableSlotMap, quickComposerSelection.date)
        : false,
    [bookableSlotMap, quickComposerSelection],
  );
  const activeSelectionDuration = useMemo(
    () =>
      quickComposerSelection
        ? getSlotDurationForStart(
            quickComposerSelection.date,
            quickComposerSelection.startTime,
            availabilitySlots,
          )
        : 30,
    [availabilitySlots, quickComposerSelection],
  );
  const activeSelectionInvalidReason = useMemo(() => {
    if (!quickComposerSelection || quickComposerMode !== "appointment") {
      return null;
    }

    if (isSelectionPast(quickComposerSelection)) {
      return "Gecmis gun veya saat icin randevu olusturulamaz.";
    }

    if (!hasActiveSelectionSlotMap && isBookableSlotsFetching && activeSelectionSlotStarts.length === 0) {
      return "Slot uygunlugu dogrulaniyor.";
    }

    if (!activeSelectionSlotStarts.includes(quickComposerSelection.startTime)) {
      return "Bu hucre secili doktor icin gecerli bir musait slot degil.";
    }

    return null;
  }, [
    activeSelectionSlotStarts,
    hasActiveSelectionSlotMap,
    isBookableSlotsFetching,
    quickComposerMode,
    quickComposerSelection,
  ]);
  const clinicNow = useMemo(() => getClinicNowParts(), []);
  const isAnchorDateInPast = useMemo(
    () => format(anchorDate, "yyyy-MM-dd") < clinicNow.date,
    [anchorDate, clinicNow.date],
  );

  const eventPropGetter: EventPropGetter<CalendarEvent> = (event) => {
    if (event.type === "appointment") {
      const appointment = event.resource as Appointment;
      const statusStyles: Record<string, { backgroundColor: string; borderColor: string; color: string }> = {
        pending: { backgroundColor: "#fff7ed", borderColor: "#fdba74", color: "#9a3412" },
        confirmed: { backgroundColor: "#dbeafe", borderColor: "#60a5fa", color: "#1d4ed8" },
        completed: { backgroundColor: "#dcfce7", borderColor: "#4ade80", color: "#166534" },
        cancelled: { backgroundColor: "#fee2e2", borderColor: "#f87171", color: "#991b1b" },
        no_show: { backgroundColor: "#e2e8f0", borderColor: "#94a3b8", color: "#334155" },
      };
      const style = statusStyles[appointment.status] ?? statusStyles.confirmed;

      return {
        style: {
          ...style,
          cursor: "pointer",
          zIndex: 2,
          borderRadius: "10px",
          boxShadow: "none",
          padding: "2px 6px",
        },
      };
    }

    if (event.type === "blackout") {
      return {
        style: {
          backgroundColor: "#fee2e2",
          borderColor: "#fca5a5",
          color: "#991b1b",
          cursor: "pointer",
          zIndex: 1,
          borderRadius: "10px",
        },
      };
    }

    return {
      style: {
        backgroundColor: "#fef3c7",
        borderColor: "#fbbf24",
        color: "#92400e",
        cursor: "pointer",
        zIndex: 1,
        borderRadius: "10px",
      },
    };
  };

  const availabilitySummary = useMemo(() => {
    const activeSlots = availabilitySlots.filter((slot) => slot.is_active !== false);
    const todaySlotCount = activeSlots.filter((slot) => slot.day_of_week === anchorDate.getDay()).length;

    return {
      weeklyTemplateCount: activeSlots.length,
      todaySlotCount,
      overrideCount: overrideList.length,
    };
  }, [anchorDate, availabilitySlots, overrideList]);

  const handleSelectEvent = (event: CalendarEvent) => {
    setIsQuickComposerOpen(false);
    setQuickComposerSelection(null);

    if (event.type === "appointment") {
      setSelectedAppointment(event.resource as Appointment);
      return;
    }

    if (event.type === "blackout" || event.type === "custom_hours") {
      const override = event.resource as AvailabilityOverride;
      setOverrideModal({
        open: true,
        mode: "edit",
        override,
      });
    }
  };

  const closeQuickComposer = () => {
    setIsQuickComposerOpen(false);
    setQuickComposerSelection(null);
  };

  const handleOpenQuickComposer = async (
    selection: SchedulerSelection,
    nextMode: QuickComposerMode = "appointment",
  ) => {
    if (isSelectionPast(selection)) {
      toast.error("Gecmis gun veya saat icin yeni kayit olusturulamaz");
      return;
    }

    if (nextMode === "appointment") {
      const validStarts = Object.prototype.hasOwnProperty.call(bookableSlotMap, selection.date)
        ? bookableSlotMap[selection.date] ?? []
        : await api.availability.getDoctorSlots(doctorId, selection.date);
      if (!validStarts.includes(selection.startTime)) {
        toast.error("Yalnizca gercek musait slotlardan randevu olusturabilirsiniz");
        return;
      }

      const slotDuration = getSlotDurationForStart(
        selection.date,
        selection.startTime,
        availabilitySlots,
      );
      selection = buildSchedulerSelection(
        selection.date,
        selection.startTime,
        addMinutesToTime(selection.startTime, slotDuration),
      );
    }

    setQuickComposerSelection(selection);
    setQuickComposerMode(nextMode);
    setIsQuickComposerOpen(true);
  };

  const isLoading = isAvailabilityLoading || isCalendarLoading;
  const isError = isAvailabilityError || isCalendarError;
  const error = availabilityError ?? calendarError;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-72 rounded-2xl" />
        <Skeleton className="h-[780px] w-full rounded-[28px]" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert className="rounded-2xl">
        <AlertTitle>Takvim yuklenemedi</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : "Bilinmeyen bir hata olustu."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <div className="rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(248,251,255,0.98),rgba(255,255,255,0.98))] p-4 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.28)]">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CalendarDays className="h-4 w-4 text-primary" />
            Takvim Gezgini
          </div>
          <MiniCalendar
            mode="single"
            selected={anchorDate}
            onSelect={(date) => date && setAnchorDate(date)}
            month={anchorDate}
            onMonthChange={setAnchorDate}
            className="rounded-[24px] border border-slate-100 bg-white/80 p-3"
          />
        </div>

        <div className="rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-4 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.28)]">
          <div className="text-sm font-semibold text-slate-800">Calisma Baglami</div>
          <div className="mt-3 rounded-[22px] bg-slate-50/90 p-3.5">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
              {variant === "staff" ? "Secili doktor" : "Takvim sahibi"}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <UserRound className="h-4 w-4 text-primary" />
              {doctorName ?? "Doktor"}
            </div>
            {doctorSubtitle ? <div className="mt-1 text-xs text-slate-500">{doctorSubtitle}</div> : null}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-[20px] bg-slate-50/90 p-3">
              <div className="text-lg font-semibold text-slate-900">{availabilitySummary.todaySlotCount}</div>
              <div className="text-[11px] text-slate-500">Bugun Slot</div>
            </div>
            <div className="rounded-[20px] bg-slate-50/90 p-3">
              <div className="text-lg font-semibold text-slate-900">{availabilitySummary.weeklyTemplateCount}</div>
              <div className="text-[11px] text-slate-500">Haftalik</div>
            </div>
            <div className="rounded-[20px] bg-slate-50/90 p-3">
              <div className="text-lg font-semibold text-slate-900">{availabilitySummary.overrideCount}</div>
              <div className="text-[11px] text-slate-500">Istisna</div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96))] p-4 shadow-[0_20px_40px_-34px_rgba(15,23,42,0.28)]">
          <div className="text-sm font-semibold text-slate-800">Takvim Katmanlari</div>
          <div className="mt-3 space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-blue-500" />
              <span className="text-slate-600">Randevular</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="text-slate-600">Blok / Kapali Gun</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="text-slate-600">Ozel Saat</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-emerald-200" />
              <span className="text-slate-600">Haftalik Musaitlik Izleri</span>
            </div>
          </div>
          <div className="mt-4 rounded-[22px] border border-dashed border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-500">
            Izgara secimi yalnizca tarih bazli aksiyon acilir. Haftalik musaitlik ayri yonetilir.
          </div>
        </div>
      </aside>

      <div className="relative overflow-hidden rounded-[34px] border border-slate-200/90 bg-[linear-gradient(180deg,rgba(248,251,255,0.72),rgba(255,255,255,0.98)_16%,rgba(255,255,255,1)_100%)] shadow-[0_30px_60px_-34px_rgba(15,23,42,0.3)]">
        <div className="border-b border-slate-200/80 px-6 py-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="font-display text-[28px] font-bold text-slate-950">
                {variant === "staff" ? "Randevu Takvimi" : "Calisma Takvimi"}
              </h2>
              <p className="text-sm text-slate-500">
                Gun, hafta ve ay gorunumleri ayni tarih ekseni etrafinda birlikte calisir.
              </p>
            </div>
            <div className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600">
              {visibleRangeLabel}
            </div>
          </div>
        </div>

        <SchedulerQuickComposer
          open={isQuickComposerOpen}
          doctorId={doctorId}
          doctorName={doctorName}
          selection={quickComposerSelection}
          availableSlotStarts={activeSelectionSlotStarts}
          appointmentDurationMinutes={activeSelectionDuration}
          invalidSelectionReason={activeSelectionInvalidReason}
          initialMode={quickComposerMode}
          onClose={closeQuickComposer}
          onSaved={closeQuickComposer}
        />

        <div className="scheduler-shell p-4">
          <BigCalendar
            components={{
              header: ({ date, label }) => (
                <CalendarHeader date={date} label={label} anchorDate={anchorDate} />
              ),
              dateHeader: ({ date, label }) => (
                <button type="button" onClick={() => setAnchorDate(date)} className="flex w-full justify-center py-1">
                  <span
                    className={[
                      "inline-flex min-h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm transition-colors",
                      isSameDay(date, anchorDate)
                        ? "bg-primary text-primary-foreground"
                        : "text-slate-600 hover:bg-slate-100",
                    ].join(" ")}
                  >
                    {String(label)}
                  </span>
                </button>
              ),
              toolbar: (toolbarProps) => (
                <CustomToolbar
                  {...toolbarProps}
                  anchorDate={anchorDate}
                  visibleRangeLabel={visibleRangeLabel}
                  onGoToToday={() => setAnchorDate(new Date())}
                  onNavigateAction={(action) => setAnchorDate((current) => navigateAnchorDate(current, view, action))}
                  onManageAvailability={() => setIsAvailabilitySheetOpen(true)}
                />
              ),
            }}
            localizer={localizer}
            events={events}
            view={view}
            date={anchorDate}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 760 }}
            messages={calendarMessages}
            eventPropGetter={eventPropGetter}
            slotPropGetter={(date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const timeValue = toTimeString(date);
              const isPastCell =
                dateStr < clinicNow.date ||
                (dateStr === clinicNow.date &&
                  Number(timeValue.slice(0, 2)) * 60 + Number(timeValue.slice(3, 5)) <= clinicNow.minutes);
              const validStarts = bookableSlotMap[dateStr] ?? [];
              const isSelectableStart = validStarts.includes(timeValue);
              const hasAppointment = (data?.appointments ?? []).some(
                (appointment) =>
                  appointment.appointment_date === dateStr &&
                  timeValue >= appointment.start_time.slice(0, 5) &&
                  timeValue < appointment.end_time.slice(0, 5) &&
                  appointment.status !== "cancelled",
              );
              const selectionMatches =
                quickComposerSelection &&
                isQuickComposerOpen &&
                quickComposerSelection.date === dateStr &&
                date >= quickComposerSelection.startsAt &&
                date < quickComposerSelection.endsAt;
              const matchingBlackout = (data?.overrides ?? []).find(
                (override) =>
                  override.date === dateStr &&
                  override.type === "blackout" &&
                  (!override.start_time ||
                    !override.end_time ||
                    (toTimeString(date) >= override.start_time.slice(0, 5) &&
                      toTimeString(date) < override.end_time.slice(0, 5))),
              );
              const hasFullDayBlackout =
                matchingBlackout && !matchingBlackout.start_time && !matchingBlackout.end_time;
              const matchingCustomHours = (data?.overrides ?? []).find(
                (override) =>
                  override.date === dateStr &&
                  override.type === "custom_hours" &&
                  override.start_time &&
                  override.end_time &&
                  toTimeString(date) >= override.start_time.slice(0, 5) &&
                  toTimeString(date) < override.end_time.slice(0, 5),
              );

              if (selectionMatches) {
                return {
                  className: "scheduler-slot-selected",
                  style: { backgroundColor: "#dbeafe", cursor: "pointer" },
                };
              }

              if (hasFullDayBlackout || matchingBlackout) {
                return {
                  className: hasFullDayBlackout ? "scheduler-slot-blackout-full" : "scheduler-slot-blackout-range",
                  style: { backgroundColor: hasFullDayBlackout ? "#fff1f2" : "#ffe4e6", cursor: "not-allowed" },
                };
              }

              if (matchingCustomHours) {
                return {
                  className: "scheduler-slot-custom-hours",
                  style: { backgroundColor: "#fff7ed" },
                };
              }

              if (hasAppointment) {
                return {
                  className: "scheduler-slot-booked",
                  style: { backgroundColor: "#f8fafc", cursor: "pointer" },
                };
              }

              if (isPastCell) {
                return {
                  className: "scheduler-slot-past",
                  style: { backgroundColor: "#f8fafc", cursor: "not-allowed" },
                };
              }

              if (isSelectableStart) {
                return {
                  className: "scheduler-slot-available",
                  style: { backgroundColor: "#ecfdf5", cursor: "pointer" },
                };
              }

              const dow = date.getDay();
              const inSlot = availabilitySlots.some(
                (slot) =>
                  slot.day_of_week === dow &&
                  slot.is_active &&
                  timeValue >= slot.start_time.slice(0, 5) &&
                  timeValue < slot.end_time.slice(0, 5),
              );

              return inSlot
                ? { className: "scheduler-slot-unavailable", style: { backgroundColor: "#f1f5f9", cursor: "not-allowed" } }
                : { className: "scheduler-slot-outside", style: { backgroundColor: "#ffffff", cursor: "default" } };
            }}
            onNavigate={(date) => setAnchorDate(date)}
            onView={(nextView) => setView(nextView)}
            onDrillDown={(date) => {
              setAnchorDate(date);
              setView(Views.DAY);
            }}
            getDrilldownView={() => Views.DAY}
            onSelectSlot={(slotInfo) => {
              if (view === Views.MONTH) {
                setAnchorDate(slotInfo.start);
                setQuickComposerSelection(
                  getDefaultSelectionForDate(slotInfo.start, availabilitySlots).selection,
                );
                return;
              }

              const start = slotInfo.start < slotInfo.end ? slotInfo.start : slotInfo.end;
              const end = slotInfo.end > slotInfo.start ? slotInfo.end : slotInfo.start;
              const selection = buildSchedulerSelection(
                format(start, "yyyy-MM-dd"),
                toTimeString(start),
                toTimeString(end),
              );

              if (isSelectionPast(selection)) {
                return;
              }

              setAnchorDate(start);
              handleOpenQuickComposer(selection);
            }}
            onSelectEvent={handleSelectEvent}
            selectable={(slotInfo) => {
              if (view === Views.MONTH) {
                return true;
              }

              const start = slotInfo.start < slotInfo.end ? slotInfo.start : slotInfo.end;
              const selection = buildSchedulerSelection(
                format(start, "yyyy-MM-dd"),
                toTimeString(start),
                toTimeString(slotInfo.end > slotInfo.start ? slotInfo.end : slotInfo.start),
              );

              return !isSelectionPast(selection) && (bookableSlotMap[selection.date] ?? []).includes(selection.startTime);
            }}
            popup
            culture="tr"
            step={30}
            timeslots={2}
            min={setMinutes(setHours(new Date(), 6), 0)}
            max={setMinutes(setHours(new Date(), 23), 0)}
            drilldownView={Views.DAY}
            dayLayoutAlgorithm="no-overlap"
          />
          {view === Views.MONTH ? (
            <MonthActionPanel
              date={anchorDate}
              events={monthPanelEvents}
              disableActions={isAnchorDateInPast}
              onOpenAction={(mode) =>
              handleOpenQuickComposer(getDefaultSelectionForDate(anchorDate, availabilitySlots).selection, mode)
              }
              onOpenDayView={() => setView(Views.DAY)}
            />
          ) : null}
        </div>
      </div>

      <Sheet open={isAvailabilitySheetOpen} onOpenChange={setIsAvailabilitySheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Haftalik Musaitlik ve Istisnalar</SheetTitle>
            <SheetDescription>
              Haftalik tekrar eden musaitlik burada yonetilir. Takvimde surukleyerek olusturma ise yalnizca tarih bazli aksiyonlar icindir.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-4 rounded-2xl border border-border/70 bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Haftalik Musaitlik Sablonu</h3>
                  <p className="text-sm text-muted-foreground">
                    Duzenli calisma saatleri burada kalir. Izgara secimi bu alani acmaz.
                  </p>
                </div>
                <Button
                  type="button"
                  className="rounded-xl"
                  onClick={() =>
                    setAvailabilityModal({
                      open: true,
                      mode: "create",
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Slot Ekle
                </Button>
              </div>

              {sortedAvailabilitySlots.length > 0 ? (
                <div className="space-y-3">
                  {sortedAvailabilitySlots.map((slot) => (
                    <div key={slot.id} className="rounded-2xl border border-border/70 bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{dayLabels[slot.day_of_week]}</div>
                          <div className="text-sm text-muted-foreground">{formatTimeRange(slot.start_time, slot.end_time)}</div>
                          <div className="text-sm text-muted-foreground">{slot.slot_duration} dakika</div>
                        </div>
                        <Switch
                          checked={slot.is_active}
                          onCheckedChange={(checked) => {
                            api.availability
                              .update(slot.id, { isActive: checked })
                              .then(() => {
                                toast.success("Musaitlik durumu guncellendi");
                                return onInvalidateSchedulerQueries(queryClient, doctorId);
                              })
                              .catch((error: unknown) => {
                                toast.error(error instanceof Error ? error.message : "Musaitlik durumu guncellenemedi");
                              });
                          }}
                          aria-label={`${dayLabels[slot.day_of_week]} musaitlik durumu`}
                        />
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() =>
                            setAvailabilityModal({
                              open: true,
                              mode: "edit",
                              slot,
                            })
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Duzenle
                        </Button>
                        <Button type="button" variant="destructive" className="rounded-xl" onClick={() => setSlotToDelete(slot)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Sil
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                  Henuz tanimli haftalik musaitlik bulunmuyor.
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-2xl border border-border/70 bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Tarih Bazli Istisnalar</h3>
                  <p className="text-sm text-muted-foreground">
                    Takvimdeki hizli olustur ile ayni tarih bazli aksiyonlar burada listelenir.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() =>
                    setOverrideModal({
                      open: true,
                      mode: "create",
                      initialDate: format(anchorDate, "yyyy-MM-dd"),
                      initialType: "blackout",
                    })
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Istisna Ekle
                </Button>
              </div>

              {isOverrideListLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <Skeleton key={item} className="h-24 rounded-2xl" />
                  ))}
                </div>
              ) : sortedOverrides.length > 0 ? (
                <div className="space-y-3">
                  {sortedOverrides.map((override) => {
                    const badge = getOverrideBadge(override.type);
                    return (
                      <div key={override.id} className="rounded-2xl border border-border/70 bg-background p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="font-semibold">
                              {format(parseCalendarDate(override.date), "d MMMM yyyy", { locale: tr })}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={badge.className}>
                                {badge.label}
                              </Badge>
                              {override.type === "custom_hours" && override.start_time && override.end_time ? (
                                <span className="text-sm text-muted-foreground">
                                  {formatTimeRange(override.start_time, override.end_time)}
                                </span>
                              ) : null}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {override.reason || "Sebep belirtilmedi"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() =>
                                setOverrideModal({
                                  open: true,
                                  mode: "edit",
                                  override,
                                })
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Duzenle
                            </Button>
                            <Button type="button" variant="destructive" className="rounded-xl" onClick={() => setOverrideToDelete(override)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Sil
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                  Henuz tanimli tarih bazli istisna bulunmuyor.
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={Boolean(slotToDelete)} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Musaitlik silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {slotToDelete
                ? `${dayLabels[slotToDelete.day_of_week]} gunundeki ${formatTimeRange(slotToDelete.start_time, slotToDelete.end_time)} araligi kaldirilacak.`
                : "Bu musaitlik slotu kaldirilacak."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSlotToDelete(null)}>Iptal</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={removeAvailability.isPending}
              onClick={() => {
                if (slotToDelete) {
                  removeAvailability.mutate(slotToDelete.id);
                }
              }}
            >
              {removeAvailability.isPending ? "Siliniyor..." : "Sil"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(overrideToDelete)} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Istisna silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {overrideToDelete
                ? `${format(parseCalendarDate(overrideToDelete.date), "d MMMM yyyy", { locale: tr })} tarihli istisna kaldirilacak.`
                : "Bu istisna kaldirilacak."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOverrideToDelete(null)}>Iptal</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={removeOverride.isPending}
              onClick={() => {
                if (overrideToDelete) {
                  removeOverride.mutate(overrideToDelete.id);
                }
              }}
            >
              {removeOverride.isPending ? "Siliniyor..." : "Sil"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AvailabilityModal
        open={availabilityModal.open}
        onClose={() => setAvailabilityModal({ open: false, mode: "create" })}
        mode={availabilityModal.mode}
        doctorId={doctorId}
        initialDayOfWeek={availabilityModal.dayOfWeek}
        initialStartTime={availabilityModal.startTime}
        initialEndTime={availabilityModal.endTime}
        slot={availabilityModal.slot}
        onSaved={() => {
          setAvailabilityModal({ open: false, mode: "create" });
          void onInvalidateSchedulerQueries(queryClient, doctorId);
        }}
      />

      <OverrideModal
        open={overrideModal.open}
        onClose={() => setOverrideModal({ open: false, mode: "create" })}
        mode={overrideModal.mode}
        doctorId={doctorId}
        initialDate={overrideModal.initialDate}
        initialType={overrideModal.initialType}
        override={overrideModal.override}
        onSaved={() => {
          setOverrideModal({ open: false, mode: "create" });
          void onInvalidateSchedulerQueries(queryClient, doctorId);
        }}
      />

      <AppointmentDetailSheet
        appointment={selectedAppointment}
        open={Boolean(selectedAppointment)}
        onClose={() => setSelectedAppointment(null)}
      />
    </div>
  );
}
