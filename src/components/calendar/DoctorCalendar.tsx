import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar as BigCalendar,
  Views,
  dateFnsLocalizer,
  type EventPropGetter,
  type SlotInfo,
  type ToolbarProps,
  type View,
} from "react-big-calendar";
import {
  addMinutes,
  addDays,
  differenceInMinutes,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isToday,
  parse,
  setHours,
  setMinutes,
  startOfMonth,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  Ban,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Loader2,
  Pencil,
  Search,
  Settings2,
  Trash2,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { AvailabilityModal } from "@/components/calendar/AvailabilityModal";
import { OverrideModal } from "@/components/calendar/OverrideModal";
import { AppointmentDetailSheet } from "@/components/appointments/AppointmentDetailSheet";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/services/api";
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Appointment,
  AvailabilitySlot,
  AvailabilityOverride,
  CalendarEvent,
} from "@/types/calendar";
import {
  appointmentsToEvents,
  overridesToEvents,
  parseDateOnly,
} from "@/utils/calendarUtils";
import TimeGrid from "react-big-calendar/lib/TimeGrid";

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
  noEventsInRange: "Bu aralikta etkinlik yok",
  showMore: (total: number) => `+${total} daha`,
};

interface DoctorCalendarProps {
  doctorId: string;
  mode?: "staff" | "doctor";
  doctorName?: string;
  specializationName?: string;
  defaultDuration?: number;
  calendarDate?: Date;
  onCalendarDateChange?: (date: Date) => void;
  calendarView?: View;
  onCalendarViewChange?: (view: View) => void;
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
  patient?: {
    id?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface CustomToolbarProps extends ToolbarProps<SchedulerEvent, object> {
  onManageAvailability: () => void;
  calendarTitle: string;
  specializationName?: string;
}

interface CalendarHeaderProps {
  date: Date;
  onContextMenu: (event: React.MouseEvent<HTMLElement>, date: Date) => void;
}

interface AvailabilityDraftPreview {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface AvailabilitySelectionTarget {
  relatedSlots: AvailabilitySlot[];
  primarySlot: AvailabilitySlot | null;
  prefillStart: Date;
  prefillEnd: Date;
  slotDuration: number;
  shouldPrefillExpand: boolean;
}

interface QuickActionState {
  open: boolean;
  kind: "available" | "unavailable" | "blocked";
  start: Date;
  end: Date;
  dayOfWeek: number;
  dateLabel: string;
  timeLabel: string;
  anchor: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  override: AvailabilityOverride | null;
  availabilityTarget: AvailabilitySelectionTarget | null;
}

interface BlockActionState {
  open: boolean;
  start: Date;
  end: Date;
  dateLabel: string;
  timeLabel: string;
}

interface AppointmentComposerState {
  open: boolean;
  start: Date;
  end: Date;
  dateLabel: string;
  timeLabel: string;
}

interface PatientLookupRecord {
  id: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface SchedulerDraftEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: "draft";
  resource: {
    durationMinutes: number;
    source: "availability" | "selection";
  };
}

interface AvailabilitySurfaceEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: "availability-surface";
  resource: {
    slotIds: string[];
  };
}

interface BlackoutSurfaceEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: "blackout-surface";
  resource: {
    overrideId: string;
  };
}

interface AvailabilityWindow {
  start: Date;
  end: Date;
  slots: AvailabilitySlot[];
  slotIds: string[];
}

type SchedulerEvent =
  | CalendarEvent
  | SchedulerDraftEvent
  | AvailabilitySurfaceEvent
  | BlackoutSurfaceEvent;

const supportedSlotDurations = [15, 20, 30, 45, 60, 90] as const;

const toolbarViewLabels = {
  [Views.MONTH]: "Ay",
  [Views.WEEK]: "Hafta",
  [Views.DAY]: "Gun",
  [Views.AGENDA]: "Ajanda",
} as const;

const toolbarViews = [Views.WEEK, Views.DAY, Views.MONTH, Views.AGENDA] as const;

const dayLabels: Record<number, string> = {
  0: "Pazar",
  1: "Pazartesi",
  2: "Sali",
  3: "Carsamba",
  4: "Persembe",
  5: "Cuma",
  6: "Cumartesi",
};

function formatTimeRange(startTime: string, endTime: string) {
  return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
}

function getAvailabilitySortValue(slot: AvailabilitySlot) {
  const normalizedDay = slot.day_of_week === 0 ? 7 : slot.day_of_week;
  return (
    normalizedDay * 10000 +
    Number(slot.start_time.slice(0, 2)) * 100 +
    Number(slot.start_time.slice(3, 5))
  );
}

function getOverrideBadge(type: AvailabilityOverride["type"]) {
  return type === "blackout"
    ? {
        label: "Kapali gun",
        className: "border-destructive/20 bg-destructive/10 text-destructive",
      }
    : {
        label: "Bloklu zaman",
        className: "border-warning/30 bg-warning/10 text-warning",
      };
}

function compareOverrides(left: AvailabilityOverride, right: AvailabilityOverride) {
  const dateDiff =
    parseDateOnly(left.date).getTime() - parseDateOnly(right.date).getTime();

  if (dateDiff !== 0) {
    return dateDiff;
  }

  if (left.type !== right.type) {
    return left.type === "blackout" ? -1 : 1;
  }

  const startDiff =
    timeToMinutes(left.start_time ?? "00:00") - timeToMinutes(right.start_time ?? "00:00");

  if (startDiff !== 0) {
    return startDiff;
  }

  const endDiff =
    timeToMinutes(left.end_time ?? "00:00") - timeToMinutes(right.end_time ?? "00:00");

  if (endDiff !== 0) {
    return endDiff;
  }

  return left.id.localeCompare(right.id);
}

function getRollingWeekRange(date: Date) {
  const anchor = startOfWeek(startOfDay(date), { weekStartsOn: 1, locale: tr });
  return Array.from({ length: 7 }, (_, index) => addDays(anchor, index));
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function subtractBlockedRange(
  segments: Array<{ start: number; end: number }>,
  blockedStart: number,
  blockedEnd: number,
) {
  return segments.flatMap((segment) => {
    if (blockedEnd <= segment.start || blockedStart >= segment.end) {
      return [segment];
    }

    const nextSegments: Array<{ start: number; end: number }> = [];

    if (blockedStart > segment.start) {
      nextSegments.push({
        start: segment.start,
        end: blockedStart,
      });
    }

    if (blockedEnd < segment.end) {
      nextSegments.push({
        start: blockedEnd,
        end: segment.end,
      });
    }

    return nextSegments;
  });
}

function normalizeMinuteRange(start: number, end: number) {
  return {
    start: Math.min(start, end),
    end: Math.max(start, end),
  };
}

function getSupportedSlotDuration(
  defaultDuration: number,
  ...candidates: Array<number | null | undefined>
) {
  for (const candidate of candidates) {
    if (candidate && supportedSlotDurations.includes(candidate as (typeof supportedSlotDurations)[number])) {
      return candidate;
    }
  }

  return defaultDuration;
}

function withTime(date: Date, time: string) {
  const [hours, minutes] = time.slice(0, 5).split(":").map(Number);
  return setMinutes(setHours(startOfDay(date), hours), minutes);
}

function formatDurationLabel(durationMinutes: number) {
  if (durationMinutes < 60) {
    return `${durationMinutes} dk`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  return minutes === 0 ? `${hours} sa` : `${hours} sa ${minutes} dk`;
}

function getDateRange(date: Date, view: View) {
  switch (view) {
    case Views.MONTH:
      return {
        rangeStart: startOfMonth(date),
        rangeEnd: endOfMonth(date),
      };
    case Views.WEEK:
      return {
        rangeStart: getRollingWeekRange(date)[0],
        rangeEnd: getRollingWeekRange(date)[6],
      };
    case Views.DAY:
      return {
        rangeStart: date,
        rangeEnd: date,
      };
    case Views.AGENDA:
      return {
        rangeStart: date,
        rangeEnd: addDays(date, 30),
      };
    default:
      return {
        rangeStart: startOfWeek(date, { weekStartsOn: 1, locale: tr }),
        rangeEnd: endOfWeek(date, { weekStartsOn: 1, locale: tr }),
      };
  }
}

function formatToolbarRangeLabel(date: Date, view: View) {
  if (view === Views.WEEK) {
    const [weekStart, , , , , , weekEnd] = getRollingWeekRange(date);

    if (
      format(weekStart, "MMMM yyyy", { locale: tr }) ===
      format(weekEnd, "MMMM yyyy", { locale: tr })
    ) {
      return `${format(weekStart, "d", { locale: tr })} - ${format(
        weekEnd,
        "d MMMM yyyy",
        { locale: tr },
      )}`;
    }

    return `${format(weekStart, "d MMM", { locale: tr })} - ${format(
      weekEnd,
      "d MMM yyyy",
      { locale: tr },
    )}`;
  }

  if (view === Views.DAY) {
    return format(date, "EEEE, d MMMM yyyy", { locale: tr });
  }

  if (view === Views.MONTH) {
    return format(date, "MMMM yyyy", { locale: tr });
  }

  return `Ajanda - ${format(date, "d MMMM yyyy", { locale: tr })}`;
}

const TimeGridComponent =
  TimeGrid as unknown as React.ComponentType<Record<string, unknown>>;

interface RollingWeekViewProps {
  date: Date;
  [key: string]: unknown;
}

const RollingWeekView = Object.assign(
  function RollingWeekView(props: RollingWeekViewProps) {
    const range = getRollingWeekRange(props.date);
    return <TimeGridComponent {...props} range={range} eventOffset={15} />;
  },
  {
    range: getRollingWeekRange,
    navigate(date: Date, action: string) {
      switch (action) {
        case "PREV":
          return addDays(date, -7);
        case "NEXT":
          return addDays(date, 7);
        case "TODAY":
          return new Date();
        default:
          return date;
      }
    },
    title(date: Date) {
      return formatToolbarRangeLabel(date, Views.WEEK);
    },
  },
);

function getQuickActionPosition(
  anchor: QuickActionState["anchor"],
  calendarBounds?: DOMRect | null,
) {
  const panelWidth = 320;
  const panelHeight = 360;
  const gutter = 12;
  const calendarInset = 8;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const calendarLeft = calendarBounds ? calendarBounds.left + calendarInset : gutter;
  const calendarRight = calendarBounds
    ? calendarBounds.right - calendarInset
    : viewportWidth - gutter;
  const calendarTop = calendarBounds ? calendarBounds.top + calendarInset : gutter;
  const calendarBottom = calendarBounds
    ? calendarBounds.bottom - calendarInset
    : viewportHeight - gutter;
  const minLeft = Math.max(gutter, calendarLeft);
  const maxLeft = Math.min(
    viewportWidth - panelWidth - gutter,
    calendarRight - panelWidth,
  );
  const anchorMidY = anchor.top + (anchor.bottom - anchor.top) / 2;
  const preferredRight = anchor.right + 10;
  const preferredLeft = anchor.left - panelWidth - 10;
  const canPlaceRight =
    preferredRight + panelWidth <= Math.min(calendarRight, viewportWidth - gutter);
  const canPlaceLeft = preferredLeft >= Math.max(gutter, calendarLeft);

  let left = canPlaceRight
    ? preferredRight
    : canPlaceLeft
      ? preferredLeft
      : Math.min(
          Math.max(anchor.left - panelWidth / 2, minLeft),
          Math.max(minLeft, maxLeft),
        );

  let top = anchorMidY - panelHeight / 2;
  const minTop = Math.max(gutter, calendarTop);
  const maxTop = Math.min(
    viewportHeight - panelHeight - gutter,
    calendarBottom - panelHeight,
  );

  top = Math.min(Math.max(top, minTop), Math.max(minTop, maxTop));
  left = Math.min(Math.max(left, minLeft), Math.max(minLeft, maxLeft));

  return {
    left: left - (calendarBounds?.left ?? 0),
    top: top - (calendarBounds?.top ?? 0),
    width: panelWidth,
  };
}

function getCalendarScrollContainer(calendarShell: HTMLElement | null) {
  return calendarShell?.querySelector(".rbc-time-content") as HTMLElement | null;
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "Hasta" };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? "-",
  };
}

function getPatientName(patient: PatientLookupRecord) {
  return [patient.first_name ?? patient.firstName, patient.last_name ?? patient.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
}

const CustomToolbar = ({
  date,
  onNavigate,
  onView,
  view,
  onManageAvailability,
  calendarTitle,
  specializationName,
}: CustomToolbarProps) => (
  <div className="scheduler-toolbar-shell">
    <div className="scheduler-toolbar-row">
      <div className="scheduler-toolbar-primary">
        <Button
          type="button"
          variant="outline"
          className="scheduler-toolbar-today-button rounded-full"
          onClick={() => onNavigate("TODAY")}
        >
          Bugun
        </Button>

        <div className="scheduler-nav-group">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="scheduler-toolbar-nav-button rounded-full"
            onClick={() => onNavigate("PREV")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="scheduler-toolbar-nav-button rounded-full"
            onClick={() => onNavigate("NEXT")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-w-0">
          <div className="scheduler-toolbar-title-row">
            <h3 className="scheduler-toolbar-title">
              {formatToolbarRangeLabel(date, view)}
            </h3>
            <div className="scheduler-toolbar-context">
              <span className="scheduler-toolbar-context-name">{calendarTitle}</span>
              {specializationName ? (
                <span className="scheduler-toolbar-context-dot" aria-hidden="true" />
              ) : null}
              {specializationName ? (
                <span className="scheduler-toolbar-context-specialization">
                  {specializationName}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="scheduler-toolbar-actions">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="scheduler-toolbar-view-button rounded-full"
            >
              {toolbarViewLabels[view]}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-2xl">
            {toolbarViews.map((toolbarView) => (
              <DropdownMenuItem
                key={toolbarView}
                onClick={() => onView(toolbarView)}
                className={cn(
                  "rounded-xl",
                  view === toolbarView && "bg-accent text-foreground",
                )}
              >
                {toolbarViewLabels[toolbarView]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          type="button"
          variant="outline"
          className="scheduler-toolbar-manage-button rounded-full"
          onClick={onManageAvailability}
        >
          <Settings2 className="mr-2 h-4 w-4" />
          Musaitlik paneli
        </Button>
      </div>
    </div>

  </div>
);

const CalendarHeader = ({ date, onContextMenu }: CalendarHeaderProps) => {
  const currentDay = isToday(date);

  return (
    <div
      onContextMenu={(event) => onContextMenu(event, date)}
      className={cn(
        "scheduler-week-header",
        currentDay && "scheduler-week-header-today",
      )}
      title="Sag tik: gunluk istisna ekle. Haftalik slotlar panelden duzenlenir."
    >
      <span className="scheduler-week-header-day">
        {format(date, "EEE", { locale: tr })}
      </span>
      <span className="scheduler-week-header-date">
        {format(date, "d", { locale: tr })}
      </span>
    </div>
  );
};

function CalendarEventContent({
  event,
  title,
  view,
}: {
  event: SchedulerEvent;
  title: string;
  view?: string;
}) {
  const timeRange = `${format(event.start, "HH:mm")} - ${format(event.end, "HH:mm")}`;

  if (event.type === "availability-surface" || event.type === "blackout-surface") {
    return null;
  }

  if (view === Views.MONTH) {
    return (
      <div className="truncate text-[11px] leading-tight">
        <span className="font-bold opacity-80">{format(event.start, "HH:mm")}</span>{" "}
        <span className="font-semibold">{title}</span>
      </div>
    );
  }

  if (event.type === "draft") {
    return (
      <div className="scheduler-event-content-stack">
        <span className="scheduler-event-meta">Taslak</span>
        <span className="scheduler-event-title">{timeRange}</span>
        <span className="scheduler-event-subtitle">
          {formatDurationLabel(event.resource.durationMinutes)}
        </span>
      </div>
    );
  }

  if (view === Views.AGENDA) {
    const agendaToneClass =
      event.type === "appointment"
        ? "scheduler-agenda-event-appointment"
        : event.type === "blackout"
          ? "scheduler-agenda-event-blackout"
          : "scheduler-agenda-event-custom-hours";
    const agendaLabel =
      event.type === "appointment"
        ? "Randevu"
        : event.type === "blackout"
          ? "Kapali gun"
          : "Blok";

    return (
      <div className={cn("scheduler-agenda-event", agendaToneClass)}>
        <span className="scheduler-agenda-event-label">{agendaLabel}</span>
        <span className="scheduler-agenda-event-time">{timeRange}</span>
        <span className="scheduler-agenda-event-title">{title}</span>
      </div>
    );
  }

  return (
    <div className="scheduler-event-content-stack">
      <span className="scheduler-event-meta">{timeRange}</span>
      <span className="scheduler-event-title">{title}</span>
    </div>
  );
}

function toApiDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function DoctorCalendar({
  doctorId,
  mode = "doctor",
  doctorName = "Doktor",
  specializationName,
  defaultDuration = 30,
  calendarDate,
  onCalendarDateChange,
  calendarView,
  onCalendarViewChange,
}: DoctorCalendarProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const calendarShellRef = useRef<HTMLDivElement | null>(null);
  const resolvedDefaultDuration = supportedSlotDurations.includes(
    defaultDuration as (typeof supportedSlotDurations)[number],
  )
    ? defaultDuration
    : 30;

  const [internalCurrentDate, setInternalCurrentDate] = useState(new Date());
  const [internalView, setInternalView] = useState<View>(Views.WEEK);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(
    null,
  );
  const [selectedCalendarEventId, setSelectedCalendarEventId] = useState<string | null>(
    null,
  );
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(
    null,
  );
  const [availabilityDraft, setAvailabilityDraft] =
    useState<AvailabilityDraftPreview | null>(null);
  const [availabilityModal, setAvailabilityModal] = useState<{
    open: boolean;
    mode: "create" | "edit";
    dayOfWeek?: number;
    startTime?: string;
    endTime?: string;
    slotDuration?: number;
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
  const [overrideToDelete, setOverrideToDelete] =
    useState<AvailabilityOverride | null>(null);
  const [contextMenuState, setContextMenuState] = useState<{
    open: boolean;
    x: number;
    y: number;
    date?: Date;
  }>({ open: false, x: 0, y: 0 });
  const [quickActionSlot, setQuickActionSlot] = useState<QuickActionState | null>(
    null,
  );
  const [blockActionState, setBlockActionState] = useState<BlockActionState | null>(
    null,
  );
  const [appointmentComposer, setAppointmentComposer] =
    useState<AppointmentComposerState | null>(null);
  const [appointmentMode, setAppointmentMode] =
    useState<"registered" | "manual">("registered");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [manualPatientName, setManualPatientName] = useState("");
  const [manualPatientPhone, setManualPatientPhone] = useState("");
  const [manualPatientNote, setManualPatientNote] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");

  const resolvedCurrentDate = calendarDate ?? internalCurrentDate;
  const resolvedView = calendarView ?? internalView;

  const setCalendarDate = (nextDate: Date) => {
    onCalendarDateChange?.(nextDate);
    if (calendarDate === undefined) {
      setInternalCurrentDate(nextDate);
    }
  };

  const setCalendarView = (nextView: View) => {
    onCalendarViewChange?.(nextView);
    if (calendarView === undefined) {
      setInternalView(nextView);
    }
  };

  const { rangeStart, rangeEnd } = useMemo(
    () => getDateRange(resolvedCurrentDate, resolvedView),
    [resolvedCurrentDate, resolvedView],
  );

  const overrideRangeStart = useMemo(
    () => format(subDays(new Date(), 30), "yyyy-MM-dd"),
    [],
  );
  const overrideRangeEnd = useMemo(
    () => format(addDays(new Date(), 365), "yyyy-MM-dd"),
    [],
  );

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
    queryKey: [
      "doctor-calendar",
      doctorId,
      toApiDate(rangeStart),
      toApiDate(rangeEnd),
      resolvedView,
    ],
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

      const normalizedAppointments: Appointment[] = appointments.map(
        (appointment) => ({
          id: appointment.id,
          doctor_id: appointment.doctor_id,
          patient_id: appointment.patient_id,
          appointment_date: appointment.appointment_date,
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          status: appointment.status,
          type: appointment.type ?? "",
          patient: {
            id: appointment.patient?.id ?? "",
            firstName: appointment.patient?.firstName ?? "",
            lastName: appointment.patient?.lastName ?? "",
          },
        }),
      );

      return {
        overrides,
        appointments: normalizedAppointments,
      };
    },
    enabled: Boolean(doctorId),
  });

  const {
    data: overrideList = [],
    isLoading: isOverrideListLoading,
  } = useQuery({
    queryKey: ["availability-overrides", doctorId, overrideRangeStart, overrideRangeEnd],
    queryFn: async () =>
      api.availabilityOverrides.listByDoctor(
        doctorId,
        overrideRangeStart,
        overrideRangeEnd,
      ) as Promise<AvailabilityOverride[]>,
    enabled: Boolean(doctorId),
  });

  const {
    data: patientsResult,
    isLoading: isPatientsLoading,
  } = useQuery({
    queryKey: ["staff-calendar-patients"],
    queryFn: async () => api.patients.list({ page: 1, limit: 200 }),
    enabled: Boolean(appointmentComposer?.open),
  });

  const patients = useMemo<PatientLookupRecord[]>(
    () => (Array.isArray(patientsResult) ? patientsResult : patientsResult?.data ?? []),
    [patientsResult],
  );

  const removeAvailability = useMutation({
    mutationFn: async (slotId: string) => api.availability.remove(slotId),
    onSuccess: async () => {
      toast.success("Musaitlik silindi");
      setSlotToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["availability", doctorId] });
      await queryClient.refetchQueries({ queryKey: ["availability", doctorId] });
      await queryClient.invalidateQueries({ queryKey: ["doctor-calendar", doctorId] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Musaitlik silinemedi");
    },
  });

  const removeOverride = useMutation({
    mutationFn: async (overrideId: string) => api.availabilityOverrides.remove(overrideId),
    onSuccess: async () => {
      toast.success("Istisna silindi");
      setOverrideToDelete(null);
      await queryClient.invalidateQueries({
        queryKey: ["availability-overrides", doctorId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["doctor-calendar", doctorId],
      });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Istisna silinemedi");
    },
  });

  const createQuickBlock = useMutation({
    mutationFn: async (payload: { start: Date; end: Date }) => {
      const date = toApiDate(payload.start);
      const sameDayOverrides = (data?.overrides ?? []).filter(
        (override) => override.date === date,
      );

      const blackoutOverride = sameDayOverrides.find(
        (override) => override.type === "blackout",
      );

      const nextStart = format(payload.start, "HH:mm");
      const nextEnd = format(payload.end, "HH:mm");
      const nextRange = normalizeMinuteRange(
        timeToMinutes(nextStart),
        timeToMinutes(nextEnd),
      );

      const appointmentConflictExists = (candidateRange: {
        start: number;
        end: number;
      }) =>
        (data?.appointments ?? []).some((appointment) => {
          if (
            appointment.status === "cancelled" ||
            appointment.appointment_date !== date
          ) {
            return false;
          }

          const appointmentRange = normalizeMinuteRange(
            timeToMinutes(appointment.start_time),
            timeToMinutes(appointment.end_time),
          );

          return (
            appointmentRange.start < candidateRange.end &&
            appointmentRange.end > candidateRange.start
          );
        });

      if (blackoutOverride) {
        throw new Error("Bu gun zaten kapali olarak isaretlenmis.");
      }

      if (appointmentConflictExists(nextRange)) {
        throw new Error(
          "Secilen zaman araliginda randevu oldugu icin blok eklenemiyor.",
        );
      }

      return api.availabilityOverrides.create({
        doctor_id: doctorId,
        date,
        type: "custom_hours",
        start_time: nextStart,
        end_time: nextEnd,
      });
    },
    onSuccess: async () => {
      toast.success("Zaman bloklamasi eklendi");
      setBlockActionState(null);
      setQuickActionSlot(null);
      clearCalendarSelection();
      await queryClient.invalidateQueries({
        queryKey: ["availability-overrides", doctorId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["doctor-calendar", doctorId],
      });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Zaman blogu eklenemedi");
    },
  });

  const createAppointmentFromCalendar = useMutation({
    mutationFn: async () => {
      if (!appointmentComposer) {
        throw new Error("Randevu baglami bulunamadi");
      }

      let patientId = selectedPatientId;

      if (appointmentMode === "manual") {
        const { firstName, lastName } = splitFullName(manualPatientName);
        if (!firstName || !lastName || !manualPatientPhone.trim()) {
          throw new Error("Ad soyad ve telefon zorunludur");
        }

        const createdPatient = await api.patients.create({
          firstName,
          lastName,
          phone: manualPatientPhone.trim(),
          notes: manualPatientNote.trim() || undefined,
        });

        patientId = createdPatient?.id;
      }

      if (!patientId) {
        throw new Error("Hasta secilmedi");
      }

      return api.appointments.create({
        doctorId,
        patientId,
        appointmentDate: toApiDate(appointmentComposer.start),
        startTime: format(appointmentComposer.start, "HH:mm"),
        endTime: format(appointmentComposer.end, "HH:mm"),
        notes: appointmentNotes.trim() || undefined,
      });
    },
    onSuccess: async () => {
      toast.success("Randevu olusturuldu");
      setAppointmentComposer(null);
      setAppointmentMode("registered");
      setPatientSearch("");
      setSelectedPatientId(null);
      setManualPatientName("");
      setManualPatientPhone("");
      setManualPatientNote("");
      setAppointmentNotes("");
      setQuickActionSlot(null);
      clearCalendarSelection();
      await queryClient.invalidateQueries({
        queryKey: ["doctor-calendar", doctorId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["staff-calendar-patients"],
      });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Randevu olusturulamadi");
    },
  });

  const availabilityWindows = useMemo<AvailabilityWindow[]>(() => {
    const windows: AvailabilityWindow[] = [];
    const activeSlots = availabilitySlots.filter((slot) => slot.is_active);
    const rangeStartDay = startOfDay(rangeStart);
    const rangeEndDay = startOfDay(rangeEnd);

    for (
      let currentDay = rangeStartDay;
      currentDay.getTime() <= rangeEndDay.getTime();
      currentDay = addDays(currentDay, 1)
    ) {
      const dateKey = toApiDate(currentDay);
      const daySlots = activeSlots.filter(
        (slot) => slot.day_of_week === currentDay.getDay(),
      );
      const dayOverrides = (data?.overrides ?? []).filter(
        (override) => override.date === dateKey,
      );

      if (dayOverrides.some((override) => override.type === "blackout")) {
        continue;
      }

      const blockedRanges = dayOverrides
        .filter(
          (override) =>
            override.type === "custom_hours" &&
            override.start_time &&
            override.end_time,
        )
        .map((override) => ({
          start: timeToMinutes(override.start_time ?? "00:00"),
          end: timeToMinutes(override.end_time ?? "23:59"),
        }))
        .sort((left, right) => left.start - right.start);

      for (const slot of daySlots) {
        let segments = [
          {
            start: timeToMinutes(slot.start_time),
            end: timeToMinutes(slot.end_time),
          },
        ];

        for (const blockedRange of blockedRanges) {
          segments = subtractBlockedRange(
            segments,
            blockedRange.start,
            blockedRange.end,
          );
        }

        for (const segment of segments) {
          if (segment.end <= segment.start) {
            continue;
          }

          windows.push({
            start: withTime(currentDay, minutesToTime(segment.start)),
            end: withTime(currentDay, minutesToTime(segment.end)),
            slots: [slot],
            slotIds: [slot.id],
          });
        }
      }
    }

    const sortedWindows = windows.sort(
      (left, right) => left.start.getTime() - right.start.getTime(),
    );

    return sortedWindows.reduce<AvailabilityWindow[]>((merged, window) => {
      if (merged.length === 0) {
        return [
          {
            start: window.start,
            end: window.end,
            slots: [...window.slots],
            slotIds: [...window.slotIds],
          },
        ];
      }

      const previous = merged[merged.length - 1];

      if (
        toApiDate(previous.start) === toApiDate(window.start) &&
        window.start.getTime() <= previous.end.getTime()
      ) {
        if (window.end.getTime() > previous.end.getTime()) {
          previous.end = window.end;
        }
        previous.slots = [
          ...previous.slots,
          ...window.slots.filter(
            (slot) => !previous.slots.some((existingSlot) => existingSlot.id === slot.id),
          ),
        ];
        previous.slotIds = [...previous.slotIds, ...window.slotIds];
        return merged;
      }

      return [
        ...merged,
        {
          start: window.start,
          end: window.end,
          slots: [...window.slots],
          slotIds: [...window.slotIds],
        },
      ];
    }, []);
  }, [availabilitySlots, data?.overrides, rangeEnd, rangeStart]);

  const availabilitySurfaceEvents = useMemo<SchedulerEvent[]>(() => {
    if (resolvedView !== Views.WEEK && resolvedView !== Views.DAY) {
      return [];
    }

    return availabilityWindows.map((window) => ({
      id: `availability-surface-${window.slotIds.join("-")}-${window.start.toISOString()}`,
      title: "Musait",
      start: window.start,
      end: window.end,
      type: "availability-surface",
      resource: {
        slotIds: window.slotIds,
      },
    }));
  }, [availabilityWindows, resolvedView]);

  const blackoutSurfaceEvents = useMemo<SchedulerEvent[]>(() => {
    if (resolvedView !== Views.WEEK && resolvedView !== Views.DAY) {
      return [];
    }

    return (data?.overrides ?? []).flatMap((override) => {
      if (override.type !== "blackout") {
        return [];
      }

      const baseDate = parseDateOnly(override.date);

      return [
        {
          id: `blackout-surface-${override.id}`,
          title: "Kapali gun",
          start: withTime(baseDate, "00:00"),
          end: withTime(baseDate, "23:59"),
          type: "blackout-surface" as const,
          resource: {
            overrideId: override.id,
          },
        },
      ];
    });
  }, [data?.overrides, resolvedView]);

  const events = useMemo<SchedulerEvent[]>(() => {
    if (!data) {
      return [];
    }

    const appointmentEvents = appointmentsToEvents(data.appointments);
    const overrideEvents = overridesToEvents(data.overrides);
    return [...overrideEvents, ...appointmentEvents];
  }, [data]);

  const sortedAvailabilitySlots = useMemo(
    () =>
      [...availabilitySlots].sort(
        (left, right) => getAvailabilitySortValue(left) - getAvailabilitySortValue(right),
      ),
    [availabilitySlots],
  );

  const sortedOverrides = useMemo(
    () => [...overrideList].sort(compareOverrides),
    [overrideList],
  );

  const filteredPatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();
    if (!query) {
      return patients.slice(0, 8);
    }

    return patients
      .filter((patient) => {
        const name = getPatientName(patient).toLowerCase();
        const phone = (patient.phone ?? "").toLowerCase();
        const email = (patient.email ?? "").toLowerCase();
        return (
          name.includes(query) ||
          phone.includes(query) ||
          email.includes(query)
        );
      })
      .slice(0, 8);
  }, [patientSearch, patients]);

  const activeDraftPreview = useMemo<SchedulerDraftEvent | null>(() => {
    if (resolvedView !== Views.WEEK && resolvedView !== Views.DAY) {
      return null;
    }

    if (availabilityDraft) {
      const baseDate =
        resolvedView === Views.WEEK
          ? getRollingWeekRange(resolvedCurrentDate).find(
              (date) => date.getDay() === availabilityDraft.dayOfWeek,
            ) ?? null
          : addDays(
              startOfDay(resolvedCurrentDate),
              (availabilityDraft.dayOfWeek - resolvedCurrentDate.getDay() + 7) %
                7,
            );

      if (!baseDate) {
        return null;
      }

      const start = withTime(baseDate, availabilityDraft.startTime);
      const endCandidate = withTime(baseDate, availabilityDraft.endTime);
      const end = endCandidate > start ? endCandidate : start;

      return {
        id: "availability-draft-preview",
        title: "Taslak blok",
        start,
        end,
        type: "draft",
        resource: {
          durationMinutes: differenceInMinutes(end, start),
          source: "availability",
        },
      };
    }

    if (!quickActionSlot?.open) {
      return null;
    }

    return {
      id: "selection-draft-preview",
      title: "Secili slot",
      start: quickActionSlot.start,
      end: quickActionSlot.end,
      type: "draft",
      resource: {
        durationMinutes: Math.max(
          15,
          differenceInMinutes(quickActionSlot.end, quickActionSlot.start),
        ),
        source: "selection",
      },
    };
  }, [availabilityDraft, quickActionSlot, resolvedCurrentDate, resolvedView]);

  const selectedCalendarEvent = useMemo(
    () =>
      selectedCalendarEventId
        ? events.find((event) => event.id === selectedCalendarEventId) ?? null
        : null,
    [events, selectedCalendarEventId],
  );

  const clearCalendarSelection = () => {
    setSelectedCalendarEventId(null);
    setSelectedAppointment(null);
    setSelectedAppointmentId(null);
  };

  const resetAppointmentComposerForm = () => {
    setAppointmentMode("registered");
    setPatientSearch("");
    setSelectedPatientId(null);
    setManualPatientName("");
    setManualPatientPhone("");
    setManualPatientNote("");
    setAppointmentNotes("");
  };

  const resetCalendarActiveState = () => {
    setQuickActionSlot(null);
    setAvailabilityDraft(null);
    setBlockActionState(null);
    setContextMenuState({ open: false, x: 0, y: 0 });
    clearCalendarSelection();
  };

  const getBlockingOverrideForRange = (start: Date, end: Date) => {
    const dateStr = toApiDate(start);
    const dayOverrides = (data?.overrides ?? [])
      .filter((override) => override.date === dateStr)
      .sort(compareOverrides);

    return (
      dayOverrides.find((override) => {
        if (override.type === "blackout") {
          return true;
        }

        if (!override.start_time || !override.end_time) {
          return true;
        }

        const overrideStart = withTime(start, override.start_time);
        const overrideEnd = withTime(start, override.end_time);
        return overrideStart < end && overrideEnd > start;
      }) ?? null
    );
  };

  const getAvailabilityContextForRange = (
    start: Date,
    end: Date,
  ): AvailabilitySelectionTarget | null => {
    const overlappingWindows = availabilityWindows.filter(
      (window) =>
        toApiDate(window.start) === toApiDate(start) &&
        window.start < end &&
        window.end > start,
    );

    if (overlappingWindows.length === 0) {
      return null;
    }

    const relatedSlots = overlappingWindows.reduce<AvailabilitySlot[]>((accumulator, window) => {
      const nextSlots = window.slots.filter(
        (slot) => !accumulator.some((existingSlot) => existingSlot.id === slot.id),
      );
      return [...accumulator, ...nextSlots];
    }, []);

    const primarySlot = relatedSlots.length === 1 ? relatedSlots[0] : null;
    const prefillStart = overlappingWindows.reduce(
      (earliest, window) =>
        window.start.getTime() < earliest.getTime() ? window.start : earliest,
      start,
    );
    const prefillEnd = overlappingWindows.reduce(
      (latest, window) => (window.end.getTime() > latest.getTime() ? window.end : latest),
      end,
    );

    const shouldPrefillExpand = primarySlot
      ? start < withTime(start, primarySlot.start_time) || end > withTime(start, primarySlot.end_time)
      : overlappingWindows.length > 1;

    return {
      relatedSlots,
      primarySlot,
      prefillStart,
      prefillEnd,
      slotDuration: getSupportedSlotDuration(
        resolvedDefaultDuration,
        differenceInMinutes(end, start),
        primarySlot?.slot_duration,
        relatedSlots[0]?.slot_duration,
      ),
      shouldPrefillExpand,
    };
  };

  const getAppointmentConflictForRange = (start: Date, end: Date) =>
    (data?.appointments ?? []).some((appointment) => {
      if (appointment.status === "cancelled") {
        return false;
      }

      if (appointment.appointment_date !== toApiDate(start)) {
        return false;
      }

      const appointmentStart = withTime(start, appointment.start_time);
      const appointmentEnd = withTime(start, appointment.end_time);
      return appointmentStart < end && appointmentEnd > start;
    });

  const getSlotStateForRange = (
    start: Date,
    end: Date,
  ): {
    blockingOverride: AvailabilityOverride | null;
    availabilityTarget: AvailabilitySelectionTarget | null;
    hasAvailability: boolean;
    hasAppointmentConflict: boolean;
    isPast: boolean;
    kind: QuickActionState["kind"];
  } => {
    const blockingOverride = getBlockingOverrideForRange(start, end);
    const availabilityTarget = getAvailabilityContextForRange(start, end);
    const hasAppointmentConflict = getAppointmentConflictForRange(start, end);
    const isPast = start < new Date();

    return {
      blockingOverride,
      availabilityTarget,
      hasAvailability: Boolean(availabilityTarget),
      hasAppointmentConflict,
      isPast,
      kind: blockingOverride
        ? "blocked"
        : availabilityTarget
          ? "available"
          : "unavailable",
    };
  };

  const getSchedulerEventClassName = (event: SchedulerEvent) =>
    cn(
      "scheduler-event",
      event.type === "appointment" && "scheduler-event-appointment",
      event.type === "appointment" &&
        selectedAppointmentId === event.id &&
        "scheduler-event-appointment-selected",
      event.type === "blackout" &&
        selectedCalendarEventId === event.id &&
        "scheduler-event-override-selected",
      event.type === "blackout" && "scheduler-event-blackout",
      event.type === "custom_hours" &&
        selectedCalendarEventId === event.id &&
        "scheduler-event-override-selected",
      event.type === "custom_hours" && "scheduler-event-custom-hours",
    );

  const eventPropGetter: EventPropGetter<SchedulerEvent> = (event) => {
    if (event.type === "availability-surface") {
      return {
        className: "scheduler-event scheduler-event-availability-surface",
        style: {
          pointerEvents: "none",
          zIndex: 0,
        },
      };
    }

    if (event.type === "blackout-surface") {
      return {
        className: "scheduler-event scheduler-event-blackout-surface",
        style: {
          pointerEvents: "none",
          zIndex: 1,
        },
      };
    }

    if (event.type === "draft") {
      return {
        className: "scheduler-event scheduler-event-draft",
        style: {
          pointerEvents: "none",
        },
      };
    }

    if (resolvedView === Views.AGENDA) {
      return {};
    }

    return {
      className: getSchedulerEventClassName(event),
    };
  };

  const handleSelectEvent = (event: SchedulerEvent) => {
    resetCalendarActiveState();

    if (
      event.type === "draft" ||
      event.type === "availability-surface" ||
      event.type === "blackout-surface"
    ) {
      return;
    }

    if (event.type === "appointment") {
      const appointment = event.resource as Appointment;
      setSelectedCalendarEventId(appointment.id);
      setSelectedAppointment(appointment);
      setSelectedAppointmentId(appointment.id);
      return;
    }

    clearCalendarSelection();
    setSelectedCalendarEventId(event.id);

    if (event.type === "blackout") {
      const override = event.resource as AvailabilityOverride;
      setOverrideModal({
        open: true,
        mode: "edit",
        override,
      });
      return;
    }

    if (event.type === "custom_hours") {
      const override = event.resource as AvailabilityOverride;
      setOverrideModal({
        open: true,
        mode: "edit",
        override,
      });
    }
  };

  const handleHeaderContextMenu = (
    event: React.MouseEvent<HTMLElement>,
    date: Date,
  ) => {
    event.preventDefault();
    resetCalendarActiveState();
    setContextMenuState({
      open: true,
      x: event.clientX,
      y: event.clientY,
      date,
    });
  };

  const handleOpenOverrideCreate = (
    date: Date,
    type: "blackout" | "custom_hours",
  ) => {
    resetCalendarActiveState();
    setOverrideModal({
      open: true,
      mode: "create",
      initialDate: format(date, "yyyy-MM-dd"),
      initialType: type,
    });
  };

  const openQuickAction = (
    slotInfo: SlotInfo,
    config: {
      kind: QuickActionState["kind"];
      override?: AvailabilityOverride | null;
      availabilityTarget?: AvailabilitySelectionTarget | null;
    },
  ) => {
    const anchorSource =
      slotInfo.box ??
      slotInfo.bounds ??
      calendarShellRef.current?.getBoundingClientRect();

    if (!anchorSource) {
      return;
    }

    setContextMenuState({ open: false, x: 0, y: 0 });
    clearCalendarSelection();

    setQuickActionSlot({
      open: true,
      kind: config.kind,
      start: slotInfo.start,
      end: slotInfo.end,
      dayOfWeek: slotInfo.start.getDay(),
      dateLabel: format(slotInfo.start, "d MMMM yyyy, EEEE", { locale: tr }),
      timeLabel: `${format(slotInfo.start, "HH:mm")} - ${format(
        slotInfo.end,
        "HH:mm",
      )}`,
      anchor: {
        left: "left" in anchorSource ? anchorSource.left : anchorSource.x,
        right: "right" in anchorSource ? anchorSource.right : anchorSource.x,
        top: "top" in anchorSource ? anchorSource.top : anchorSource.y,
        bottom:
          "bottom" in anchorSource ? anchorSource.bottom : anchorSource.y,
      },
      override: config.override ?? null,
      availabilityTarget: config.availabilityTarget ?? null,
    });
  };

  useEffect(() => {
    if (!quickActionSlot?.open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setQuickActionSlot(null);
      }
    };

    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-quick-slot-panel]")) {
        return;
      }
      setQuickActionSlot(null);
    };

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("mousedown", handleClickAway);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("mousedown", handleClickAway);
    };
  }, [quickActionSlot]);

  useEffect(() => {
    setQuickActionSlot(null);
    setBlockActionState(null);
    clearCalendarSelection();
    setAppointmentComposer(null);
    resetAppointmentComposerForm();
  }, [resolvedCurrentDate, resolvedView, doctorId]);

  useEffect(() => {
    if (!activeDraftPreview || (resolvedView !== Views.WEEK && resolvedView !== Views.DAY)) {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      const draftElement = calendarShellRef.current?.querySelector(
        ".scheduler-event-draft",
      ) as HTMLElement | null;
      const scrollContainer = getCalendarScrollContainer(calendarShellRef.current);

      if (!draftElement || !scrollContainer) {
        return;
      }

      const topBuffer = 32;
      const bottomBuffer = 32;
      const draftRect = draftElement.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      const viewportTop = containerRect.top + topBuffer;
      const viewportBottom = containerRect.bottom - bottomBuffer;

      let delta = 0;
      if (draftRect.top < viewportTop) {
        delta = draftRect.top - viewportTop;
      } else if (draftRect.bottom > viewportBottom) {
        delta = draftRect.bottom - viewportBottom;
      }

      if (Math.abs(delta) > 12) {
        scrollContainer.scrollBy({ top: delta, behavior: "smooth" });
      }
    });

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [
    activeDraftPreview?.end.getTime(),
    activeDraftPreview?.id,
    activeDraftPreview?.start.getTime(),
    resolvedView,
  ]);

  useEffect(() => {
    if (resolvedView !== Views.WEEK && resolvedView !== Views.DAY) {
      return;
    }

    const calendarShell = calendarShellRef.current;
    const scrollContainer = getCalendarScrollContainer(calendarShell);

    if (!calendarShell || !scrollContainer) {
      return;
    }

    const forwardWheelToGrid = (event: WheelEvent) => {
      const target = event.target as HTMLElement | null;
      const isExcludedTarget =
        target?.closest(".rbc-toolbar") ||
        target?.closest(".scheduler-surface-context") ||
        target?.closest("[data-quick-slot-panel]");
      const shouldForwardFromFixedChrome =
        target?.closest(".rbc-time-header") || target?.closest(".rbc-time-gutter");

      if (isExcludedTarget || !shouldForwardFromFixedChrome || event.deltaY === 0) {
        return;
      }

      event.preventDefault();
      scrollContainer.scrollBy({
        top: event.deltaY,
        behavior: "auto",
      });
    };

    calendarShell.addEventListener("wheel", forwardWheelToGrid, {
      passive: false,
      capture: true,
    });

    return () => {
      calendarShell.removeEventListener("wheel", forwardWheelToGrid, true);
    };
  }, [resolvedView]);

  const isLoading = isAvailabilityLoading || isCalendarLoading;
  const isError = isAvailabilityError || isCalendarError;
  const error = availabilityError ?? calendarError;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-[28px]" />
        <Skeleton className="h-[720px] w-full rounded-[28px]" />
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

  const quickActionPosition =
    quickActionSlot?.open && !isMobile
      ? getQuickActionPosition(
          quickActionSlot.anchor,
          calendarShellRef.current?.getBoundingClientRect() ?? null,
        )
      : null;

  const surfaceContextTitle =
    doctorName ?? (mode === "staff" ? "Doktor takvimi" : "Kendi takviminiz");

  const quickActionBadge =
    quickActionSlot?.kind === "available"
      ? {
          label: "Musait zaman",
          className: "border-success/30 bg-success/10 text-success",
        }
      : quickActionSlot?.kind === "blocked"
        ? {
            label:
              quickActionSlot.override?.type === "blackout"
                ? "Kapali gun"
                : "Istisna uygulanmis",
            className:
              quickActionSlot.override?.type === "blackout"
                ? "border-destructive/25 bg-destructive/10 text-destructive"
                : "border-warning/30 bg-warning/10 text-warning",
          }
        : {
            label: "Musaitlik disi",
            className: "border-border/70 bg-muted/50 text-muted-foreground",
          };

  const quickActionCanRemoveDirectly =
    quickActionSlot?.kind === "blocked" && quickActionSlot.override
      ? quickActionSlot.override.type === "blackout" ||
        !quickActionSlot.override.start_time ||
        !quickActionSlot.override.end_time ||
        (() => {
          const overrideRange = normalizeMinuteRange(
            timeToMinutes(quickActionSlot.override?.start_time ?? "00:00"),
            timeToMinutes(quickActionSlot.override?.end_time ?? "00:00"),
          );
          const selectedRange = normalizeMinuteRange(
            timeToMinutes(format(quickActionSlot.start, "HH:mm")),
            timeToMinutes(format(quickActionSlot.end, "HH:mm")),
          );

          return (
            overrideRange.start === selectedRange.start &&
            overrideRange.end === selectedRange.end
          );
        })()
      : false;

  const canBlockSelectedRange =
    mode === "staff" &&
    !!quickActionSlot &&
    (quickActionSlot.kind === "available" ||
      quickActionSlot.kind === "unavailable");

  const availabilityQuickActionLabel =
    quickActionSlot?.availabilityTarget?.primarySlot
      ? quickActionSlot.availabilityTarget.shouldPrefillExpand
        ? "Musaitligi genislet"
        : "Musaitligi duzenle"
      : "Panelde musaitlik ekle";

  const handleQuickActionOpenAppointmentComposer = () => {
    if (!quickActionSlot || quickActionSlot.kind !== "available") {
      return;
    }

    const nextComposer: AppointmentComposerState = {
      open: true,
      start: quickActionSlot.start,
      end: quickActionSlot.end,
      dateLabel: quickActionSlot.dateLabel,
      timeLabel: quickActionSlot.timeLabel,
    };

    resetCalendarActiveState();
    resetAppointmentComposerForm();
    setAppointmentComposer(nextComposer);
  };

  const handleQuickActionOpenAvailabilityEditor = () => {
    if (!quickActionSlot) {
      return;
    }

    const availabilityTarget = quickActionSlot.availabilityTarget;
    const nextModalState = {
      open: true as const,
      mode: availabilityTarget?.primarySlot ? ("edit" as const) : ("create" as const),
      dayOfWeek: availabilityTarget?.primarySlot?.day_of_week ?? quickActionSlot.dayOfWeek,
      startTime:
        availabilityTarget?.shouldPrefillExpand || !availabilityTarget?.primarySlot
          ? format(availabilityTarget?.prefillStart ?? quickActionSlot.start, "HH:mm")
          : undefined,
      endTime:
        availabilityTarget?.shouldPrefillExpand || !availabilityTarget?.primarySlot
          ? format(availabilityTarget?.prefillEnd ?? quickActionSlot.end, "HH:mm")
          : undefined,
      slotDuration: availabilityTarget?.slotDuration,
      slot: availabilityTarget?.primarySlot ?? undefined,
    };

    resetCalendarActiveState();
    setAvailabilityModal({
      ...nextModalState,
    });
  };

  const handleQuickActionEditOverride = () => {
    if (!quickActionSlot?.override) {
      return;
    }

    resetCalendarActiveState();
    setOverrideModal({
      open: true,
      mode: "edit",
      override: quickActionSlot.override,
    });
  };

  const handleQuickActionRemoveOverride = () => {
    if (!quickActionSlot?.override) {
      return;
    }

    const override = quickActionSlot.override;

    if (override.type === "custom_hours") {
      if (!override.start_time || !override.end_time) {
        resetCalendarActiveState();
        setOverrideToDelete(override);
        return;
      }

      const overrideRange = normalizeMinuteRange(
        timeToMinutes(override.start_time),
        timeToMinutes(override.end_time),
      );

      const selectedRange = normalizeMinuteRange(
        timeToMinutes(format(quickActionSlot.start, "HH:mm")),
        timeToMinutes(format(quickActionSlot.end, "HH:mm")),
      );

      const exactMatch =
        overrideRange.start === selectedRange.start &&
        overrideRange.end === selectedRange.end;

      if (exactMatch) {
        resetCalendarActiveState();
        setOverrideToDelete(override);
        return;
      }

      toast.info(
        "Kismi blok acma bu surumde desteklenmiyor. Istisnayi duzenleme ekranindan degistirin.",
      );

      resetCalendarActiveState();
      setOverrideModal({
        open: true,
        mode: "edit",
        override,
      });
      return;
    }

    resetCalendarActiveState();
    setOverrideToDelete(override);
  };

  const handleQuickActionBlockTime = () => {
    if (!canBlockSelectedRange || !quickActionSlot) {
      return;
    }

    const nextBlockActionState: BlockActionState = {
      open: true,
      start: quickActionSlot.start,
      end: quickActionSlot.end,
      dateLabel: quickActionSlot.dateLabel,
      timeLabel: quickActionSlot.timeLabel,
    };

    resetCalendarActiveState();
    setBlockActionState(nextBlockActionState);
  };

  const handleSlotSelection = (slotInfo: SlotInfo) => {
    resetCalendarActiveState();

    if (resolvedView === Views.MONTH) {
      setCalendarDate(slotInfo.start);
      setCalendarView(Views.DAY);
      return;
    }

    const slotState = getSlotStateForRange(slotInfo.start, slotInfo.end);

    if (slotState.blockingOverride) {
      openQuickAction(slotInfo, {
        kind: "blocked",
        override: slotState.blockingOverride,
        availabilityTarget: slotState.availabilityTarget,
      });
      return;
    }

    if (slotState.hasAppointmentConflict) {
      setQuickActionSlot(null);
      return;
    }

    if (
      mode === "staff" &&
      slotState.kind === "available" &&
      slotState.hasAvailability &&
      !slotState.isPast
    ) {
      openQuickAction(slotInfo, {
        kind: "available",
        availabilityTarget: slotState.availabilityTarget,
      });
      return;
    }

    if (slotState.isPast) {
      setQuickActionSlot(null);
      return;
    }

    if (slotState.kind === "available") {
      openQuickAction(slotInfo, {
        kind: "available",
        availabilityTarget: slotState.availabilityTarget,
      });
      return;
    }

    openQuickAction(slotInfo, {
      kind: "unavailable",
      availabilityTarget: slotState.availabilityTarget,
    });
  };

  const handleMobileSlotTap = (
    slotStart: Date,
    currentTarget: HTMLElement | null,
    sourceTarget: EventTarget | null,
  ) => {
    if (!isMobile || (resolvedView !== Views.DAY && resolvedView !== Views.WEEK)) {
      return;
    }

    const sourceElement =
      sourceTarget instanceof HTMLElement ? sourceTarget : null;
    if (sourceElement?.closest(".rbc-event")) {
      return;
    }

    const anchorRect = currentTarget?.getBoundingClientRect();

    handleSlotSelection({
      action: "select",
      start: slotStart,
      end: addMinutes(slotStart, resolvedDefaultDuration),
      slots: [slotStart],
      bounds: anchorRect ?? undefined,
      box: anchorRect ?? undefined,
    } as SlotInfo);
  };

  return (
    <div
      ref={calendarShellRef}
      className="scheduler-calendar-shell flex h-full min-h-0 flex-col overflow-hidden rounded-[34px] border border-border/60 bg-card/95 shadow-soft"
    >
      {mode === "staff" ? (
        <div className="scheduler-surface-context shrink-0">
          <div className="min-w-0">
            <h2 className="scheduler-surface-context-title">{surfaceContextTitle}</h2>
          </div>
          {specializationName ? (
            <Badge variant="outline" className="scheduler-surface-context-badge">
              {specializationName}
            </Badge>
          ) : null}
        </div>
      ) : null}

      <BigCalendar<SchedulerEvent>
        className="scheduler-calendar min-h-0 flex-1"
        views={{
          month: true,
          agenda: true,
          day: true,
          week: RollingWeekView,
        }}
        components={{
          header: ({ date }) => (
            <CalendarHeader
              date={date}
              onContextMenu={handleHeaderContextMenu}
            />
          ),
          dateHeader: ({ date, label }) =>
            resolvedView === Views.MONTH ? (
              <div
                className={cn(
                  "scheduler-month-date",
                  isToday(date) && "scheduler-month-date-today",
                )}
              >
                {label}
              </div>
            ) : (
              <CalendarHeader
                date={date}
                onContextMenu={handleHeaderContextMenu}
              />
            ),
          toolbar: (toolbarProps) => (
            <CustomToolbar
              {...toolbarProps}
              calendarTitle={surfaceContextTitle}
              specializationName={specializationName}
              onManageAvailability={() => {
                resetCalendarActiveState();
                setIsAvailabilitySheetOpen(true);
              }}
            />
          ),
          event: ({ event, title }) => (
            <CalendarEventContent event={event} title={title} view={resolvedView} />
          ),
        }}
        localizer={localizer}
        events={events}
        backgroundEvents={[
          ...availabilitySurfaceEvents,
          ...blackoutSurfaceEvents,
          ...(activeDraftPreview ? [activeDraftPreview] : []),
        ]}
        defaultView={Views.WEEK}
        view={resolvedView}
        date={resolvedCurrentDate}
        selected={selectedCalendarEvent ?? undefined}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        messages={calendarMessages}
        eventPropGetter={eventPropGetter}
        backgroundEventPropGetter={eventPropGetter}
        enableAutoScroll={false}
        slotPropGetter={(date) => {
          const isPast = date < new Date();

          return {
            className: cn(
              "scheduler-slot",
              isPast && "scheduler-slot-past",
            ),
            ...(isMobile &&
            (resolvedView === Views.DAY || resolvedView === Views.WEEK)
              ? {
                  onClick: (event: {
                    currentTarget: HTMLElement;
                    target: EventTarget | null;
                  }) => {
                    handleMobileSlotTap(date, event.currentTarget, event.target);
                  },
                }
              : {}),
          };
        }}
        onNavigate={(date) => {
          resetCalendarActiveState();
          setCalendarDate(date);
        }}
        onView={(nextView) => {
          resetCalendarActiveState();
          setCalendarView(nextView);
        }}
        onDrillDown={(date, nextView) => {
          void nextView;
          resetCalendarActiveState();
          setCalendarDate(date);
          setCalendarView(Views.DAY);
        }}
        getDrilldownView={() => Views.DAY}
        onSelectSlot={handleSlotSelection}
        onSelectEvent={handleSelectEvent}
        selectable={!isMobile || resolvedView === Views.MONTH}
        popup
        culture="tr"
        step={resolvedDefaultDuration}
        timeslots={2}
        min={setMinutes(setHours(new Date(), 6), 0)}
        max={setMinutes(setHours(new Date(), 23), 0)}
        drilldownView={Views.DAY}
        dayLayoutAlgorithm="no-overlap"
      />

      {quickActionSlot?.open && quickActionPosition ? (
        <div
          data-quick-slot-panel
          className="absolute z-50 hidden rounded-[24px] border border-border/70 bg-popover/95 p-4 text-popover-foreground shadow-card outline-none backdrop-blur-xl lg:block"
          style={quickActionPosition}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {quickActionSlot.kind === "available"
                    ? "Secili musait aralik"
                    : quickActionSlot.kind === "blocked"
                      ? "Secili istisna"
                      : "Secili aralik"}
                </p>
                <h3 className="text-lg font-display font-semibold text-foreground">
                  {doctorName}
                </h3>
                {specializationName ? (
                  <p className="text-sm text-muted-foreground">
                    {specializationName}
                  </p>
                ) : null}
              </div>
              <Badge
                variant="outline"
                className={cn("rounded-full", quickActionBadge.className)}
              >
                {quickActionBadge.label}
              </Badge>
            </div>

            <div className="rounded-[20px] border border-border/70 bg-background/80 p-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Tarih</span>
                  <span className="text-right font-medium text-foreground">
                    {quickActionSlot.dateLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Saat</span>
                  <span className="font-medium text-foreground">
                    {quickActionSlot.timeLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Durum</span>
                  <Badge
                    variant="outline"
                    className={cn("rounded-full", quickActionBadge.className)}
                  >
                    {quickActionBadge.label}
                  </Badge>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {quickActionSlot.kind === "available"
                ? "Bu panel secili musait aralik icin hizli aksiyon sunar. Mevcut musaitlige tasan secimler duzenleme formuna kapsamli prefill ile gider."
                : quickActionSlot.kind === "blocked"
                  ? "Bu aralikta gunluk istisna vardir. Duzenleme ve kaldirma istisna kaydi uzerinden yapilir."
                  : "Bu aralik takvimde musaitlik disi gorunur. Musaitlik ekleme ayri panelde acilir."}
            </p>

            <div className="grid gap-2">
              {quickActionSlot.kind === "available" ? (
                <>
                  <Button
                    type="button"
                    className="justify-start rounded-xl"
                    onClick={handleQuickActionOpenAppointmentComposer}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Randevu olustur
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-start rounded-xl border-border/70 bg-background/70"
                    onClick={handleQuickActionOpenAvailabilityEditor}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {availabilityQuickActionLabel}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-start rounded-xl border-border/70 bg-background/70"
                    onClick={handleQuickActionBlockTime}
                  >
                    <CircleOff className="mr-2 h-4 w-4" />
                    Bu araliga blok istisnasi ekle
                  </Button>
                </>
              ) : null}

              {quickActionSlot.kind === "unavailable" ? (
                <>
                  <Button
                    type="button"
                    className="justify-start rounded-xl"
                    onClick={handleQuickActionOpenAvailabilityEditor}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {availabilityQuickActionLabel}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-start rounded-xl border-border/70 bg-background/70"
                    onClick={handleQuickActionBlockTime}
                  >
                    <CircleOff className="mr-2 h-4 w-4" />
                    Bu araliga blok istisnasi ekle
                  </Button>
                </>
              ) : null}

              {quickActionSlot.kind === "blocked" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-start rounded-xl border-border/70 bg-background/70"
                    onClick={handleQuickActionEditOverride}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Istisnayi panelde duzenle
                  </Button>
                  <Button
                    type="button"
                    variant={quickActionCanRemoveDirectly ? "destructive" : "outline"}
                    className={cn(
                      "justify-start rounded-xl",
                      !quickActionCanRemoveDirectly &&
                        "border-border/70 bg-background/70",
                    )}
                    onClick={handleQuickActionRemoveOverride}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {quickActionCanRemoveDirectly
                      ? "Istisnayi kaldir"
                      : "Istisnayi panelde gozden gecir"}
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <Drawer
        open={Boolean(quickActionSlot?.open) && isMobile}
        onOpenChange={(open) => {
          if (!open) {
            resetCalendarActiveState();
          }
        }}
      >
        <DrawerContent className="rounded-t-[28px]">
          <DrawerHeader>
            <DrawerTitle>
              {quickActionSlot?.kind === "available"
                ? "Secili musait aralik"
                : quickActionSlot?.kind === "blocked"
                  ? "Secili istisna"
                  : "Secili aralik"}
            </DrawerTitle>
            <DrawerDescription>
              Secilen aralik ayrintisi burada acilir. Musaitlik duzenleme ayri paneldedir.
            </DrawerDescription>
          </DrawerHeader>

          {quickActionSlot ? (
            <div className="space-y-4 px-4 pb-6">
              <div className="rounded-2xl border border-border/70 bg-background p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Doktor</span>
                    <span className="text-right font-medium text-foreground">
                      {doctorName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Tarih</span>
                    <span className="text-right font-medium text-foreground">
                      {quickActionSlot.dateLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Saat</span>
                    <span className="font-medium text-foreground">
                      {quickActionSlot.timeLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Durum</span>
                    <Badge
                      variant="outline"
                      className={cn("rounded-full", quickActionBadge.className)}
                    >
                      {quickActionBadge.label}
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {quickActionSlot.kind === "available"
                  ? "Bu panel secili musait aralik icin hizli aksiyon sunar. Mevcut musaitlige tasan secimler duzenleme formuna kapsamli prefill ile gider."
                  : quickActionSlot.kind === "blocked"
                    ? "Bu aralikta gunluk istisna vardir. Duzenleme ve kaldirma istisna kaydi uzerinden yapilir."
                    : "Bu aralik takvimde musaitlik disi gorunur. Musaitlik ekleme ayri panelde acilir."}
              </p>

              <div className="grid gap-2">
                {quickActionSlot.kind === "available" ? (
                  <>
                    <Button
                      type="button"
                      className="rounded-xl"
                      onClick={handleQuickActionOpenAppointmentComposer}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Randevu olustur
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={handleQuickActionOpenAvailabilityEditor}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      {availabilityQuickActionLabel}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={handleQuickActionBlockTime}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Bu araliga blok istisnasi ekle
                    </Button>
                  </>
                ) : null}

                {quickActionSlot.kind === "unavailable" ? (
                  <>
                    <Button
                      type="button"
                      className="rounded-xl"
                      onClick={handleQuickActionOpenAvailabilityEditor}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      {availabilityQuickActionLabel}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={handleQuickActionBlockTime}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Bu araliga blok istisnasi ekle
                    </Button>
                  </>
                ) : null}

                {quickActionSlot.kind === "blocked" ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={handleQuickActionEditOverride}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Istisnayi panelde duzenle
                    </Button>
                    <Button
                      type="button"
                      variant={quickActionCanRemoveDirectly ? "destructive" : "outline"}
                      className={cn(
                        "rounded-xl",
                        !quickActionCanRemoveDirectly &&
                          "border-border/70 bg-background/70",
                      )}
                      onClick={handleQuickActionRemoveOverride}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {quickActionCanRemoveDirectly
                        ? "Istisnayi kaldir"
                        : "Istisnayi panelde gozden gecir"}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </DrawerContent>
      </Drawer>

      <Sheet
        open={Boolean(appointmentComposer?.open)}
        onOpenChange={(open) => {
          if (!open) {
            resetCalendarActiveState();
            setAppointmentComposer(null);
            resetAppointmentComposerForm();
          }
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Randevu olustur</SheetTitle>
            <SheetDescription>
              Secilen musait zaman icin hizli randevu kaydi olusturun.
            </SheetDescription>
          </SheetHeader>

          {appointmentComposer ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-[24px] border border-border/60 bg-card/90 p-4 shadow-soft">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Doktor</span>
                    <span className="text-right font-medium text-foreground">
                      {doctorName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Tarih</span>
                    <span className="text-right font-medium text-foreground">
                      {appointmentComposer.dateLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Saat</span>
                    <span className="text-right font-medium text-foreground">
                      {appointmentComposer.timeLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-muted/30 p-1">
                <Button
                  type="button"
                  variant={appointmentMode === "registered" ? "default" : "ghost"}
                  className="rounded-xl"
                  onClick={() => {
                    setAppointmentMode("registered");
                    setManualPatientName("");
                    setManualPatientPhone("");
                    setManualPatientNote("");
                  }}
                >
                  Kayitli hasta
                </Button>
                <Button
                  type="button"
                  variant={appointmentMode === "manual" ? "default" : "ghost"}
                  className="rounded-xl"
                  onClick={() => {
                    setAppointmentMode("manual");
                    setSelectedPatientId(null);
                    setPatientSearch("");
                  }}
                >
                  Manuel giris
                </Button>
              </div>

              {appointmentMode === "registered" ? (
                <div className="space-y-4 rounded-[24px] border border-border/60 bg-background/80 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="appointment-patient-search">Hasta ara</Label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="appointment-patient-search"
                        value={patientSearch}
                        onChange={(event) => setPatientSearch(event.target.value)}
                        placeholder="Ad, telefon veya e-posta"
                        className="rounded-xl pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {isPatientsLoading ? (
                      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Hastalar yukleniyor...
                      </div>
                    ) : filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => {
                        const patientName = getPatientName(patient) || "Isimsiz hasta";
                        const isSelected = selectedPatientId === patient.id;

                        return (
                          <button
                            key={patient.id}
                            type="button"
                            onClick={() => setSelectedPatientId(patient.id)}
                            className={cn(
                              "flex w-full items-start justify-between gap-3 rounded-2xl border p-3 text-left transition-colors",
                              isSelected
                                ? "border-primary/35 bg-primary/10"
                                : "border-border/60 bg-background/80 hover:bg-muted/40",
                            )}
                          >
                            <div className="min-w-0">
                              <div className="font-medium text-foreground">{patientName}</div>
                              <div className="text-sm text-muted-foreground">
                                {[patient.phone, patient.email]
                                  .filter(Boolean)
                                  .join(" - ") || "Iletisim bilgisi yok"}
                              </div>
                            </div>
                            {isSelected ? (
                              <Badge
                                variant="outline"
                                className="rounded-full border-primary/25 bg-primary/10 text-primary"
                              >
                                Secili
                              </Badge>
                            ) : null}
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                        Aramaya uyan kayitli hasta bulunamadi.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 rounded-[24px] border border-border/60 bg-background/80 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="manual-patient-name">Ad soyad</Label>
                    <Input
                      id="manual-patient-name"
                      value={manualPatientName}
                      onChange={(event) => setManualPatientName(event.target.value)}
                      placeholder="Orn. Ayse Yilmaz"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-patient-phone">Telefon</Label>
                    <Input
                      id="manual-patient-phone"
                      value={manualPatientPhone}
                      onChange={(event) => setManualPatientPhone(event.target.value)}
                      placeholder="05xx xxx xx xx"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-patient-note">Hasta notu</Label>
                    <Textarea
                      id="manual-patient-note"
                      value={manualPatientNote}
                      onChange={(event) => setManualPatientNote(event.target.value)}
                      rows={3}
                      className="rounded-2xl"
                      placeholder="Opsiyonel kisa profil veya iletisim notu"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bu yol yalnizca staff-side hasta kaydi ve randevu icindir; giris hesabi olusturmaz.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="appointment-notes">Randevu notu</Label>
                <Textarea
                  id="appointment-notes"
                  value={appointmentNotes}
                  onChange={(event) => setAppointmentNotes(event.target.value)}
                  rows={4}
                  className="rounded-2xl"
                  placeholder="Opsiyonel ic not veya hasta talebi"
                />
              </div>

              <Button
                type="button"
                className="w-full rounded-xl"
                disabled={
                  createAppointmentFromCalendar.isPending ||
                  (appointmentMode === "registered"
                    ? !selectedPatientId
                    : !manualPatientName.trim() || !manualPatientPhone.trim())
                }
                onClick={() => createAppointmentFromCalendar.mutate()}
              >
                {createAppointmentFromCalendar.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Randevuyu kaydet
              </Button>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={Boolean(blockActionState?.open)}
        onOpenChange={(open) => {
          if (!open) {
            setBlockActionState(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu zaman araligi bloklansin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Takvimdeki secili aralik duzenlenmez; bu islem o tarih ve saat icin blok istisnasi ekler. Haftalik musaitlik kurali korunur.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {blockActionState ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Doktor</span>
                    <span className="text-right font-medium text-foreground">
                      {doctorName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Tarih</span>
                    <span className="text-right font-medium text-foreground">
                      {blockActionState.dateLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Saat</span>
                    <span className="text-right font-medium text-foreground">
                      {blockActionState.timeLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel>Iptal</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={!blockActionState || createQuickBlock.isPending}
              onClick={() => {
                if (blockActionState) {
                  createQuickBlock.mutate({
                    start: blockActionState.start,
                    end: blockActionState.end,
                  });
                }
              }}
            >
              {createQuickBlock.isPending ? "Bloklaniyor..." : "Bu zamani blokla"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu
        open={contextMenuState.open}
        onOpenChange={(open) =>
          setContextMenuState((current) => ({ ...current, open }))
        }
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed h-0 w-0 opacity-0"
            style={{ left: contextMenuState.x, top: contextMenuState.y }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={4}
          className="w-52 rounded-xl"
          style={{
            position: "fixed",
            left: contextMenuState.x,
            top: contextMenuState.y,
          }}
        >
          <DropdownMenuItem
            onClick={() =>
              contextMenuState.date &&
              handleOpenOverrideCreate(contextMenuState.date, "blackout")
            }
          >
            Bu gunu kapat
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              contextMenuState.date &&
              handleOpenOverrideCreate(contextMenuState.date, "custom_hours")
            }
          >
            Bu gune blok istisnasi ekle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet
        open={isAvailabilitySheetOpen}
        onOpenChange={(open) => {
          setIsAvailabilitySheetOpen(open);
          if (!open) {
            resetCalendarActiveState();
          }
        }}
      >
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Musaitlik paneli</SheetTitle>
            <SheetDescription>
              Haftalik musaitlik slotlarini burada duzenleyebilir, aktiflik durumunu degistirebilir veya yeni slot ekleyebilirsiniz. Takvimdeki yesil alanlar yalnizca gosterimdir.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-4 rounded-2xl border border-border/70 bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Haftalik Slotlar</h3>
                  <p className="text-sm text-muted-foreground">
                    Duzenli calisma saatlerinizi yonetin.
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
                  + Yeni Slot Ekle
                </Button>
              </div>

              {sortedAvailabilitySlots.length > 0 ? (
                <div className="space-y-3">
                  {sortedAvailabilitySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="rounded-2xl border border-border/70 bg-background p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{dayLabels[slot.day_of_week]}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatTimeRange(slot.start_time, slot.end_time)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {slot.slot_duration} dakika
                          </div>
                        </div>
                        <Switch
                          checked={slot.is_active}
                          onCheckedChange={(checked) => {
                            api.availability
                              .update(slot.id, { isActive: checked })
                              .then(() => {
                                toast.success("Musaitlik durumu guncellendi");
                                return queryClient.invalidateQueries({
                                  queryKey: ["availability", doctorId],
                                });
                              })
                              .then(() =>
                                queryClient.invalidateQueries({
                                  queryKey: ["doctor-calendar", doctorId],
                                }),
                              )
                              .catch((error: unknown) => {
                                toast.error(
                                  error instanceof Error
                                    ? error.message
                                    : "Musaitlik durumu guncellenemedi",
                                );
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
                        <Button
                          type="button"
                          variant="destructive"
                          className="rounded-xl"
                          onClick={() => setSlotToDelete(slot)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Sil
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                  Henuz tanimli musaitlik slotu bulunmuyor.
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-2xl border border-border/70 bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Istisnalar</h3>
                  <p className="text-sm text-muted-foreground">
                    Son 30 gun ve gelecek icin planlanan gunluk kapanis ve bloklu zaman istisnalari.
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
                      initialDate: format(new Date(), "yyyy-MM-dd"),
                      initialType: "blackout",
                    })
                  }
                >
                  + Istisna Ekle
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
                      <div
                        key={override.id}
                        className="rounded-2xl border border-border/70 bg-background p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="font-semibold">
                              {format(parseDateOnly(override.date), "d MMMM yyyy", {
                                locale: tr,
                              })}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={badge.className}>
                                {badge.label}
                              </Badge>
                              {override.type === "custom_hours" &&
                              override.start_time &&
                              override.end_time ? (
                                <span className="text-sm text-muted-foreground">
                                  {formatTimeRange(
                                    override.start_time,
                                    override.end_time,
                                  )}
                                </span>
                              ) : null}
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
                            <Button
                              type="button"
                              variant="destructive"
                              className="rounded-xl"
                              onClick={() => setOverrideToDelete(override)}
                            >
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
                  Tanimli istisna bulunmuyor.
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
                ? `${dayLabels[slotToDelete.day_of_week]} gunundeki ${formatTimeRange(
                    slotToDelete.start_time,
                    slotToDelete.end_time,
                  )} araligi kaldirilacak.`
                : "Bu musaitlik slotu kaldirilacak."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSlotToDelete(null)}>
              Iptal
            </AlertDialogCancel>
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
                ? `${format(parseDateOnly(overrideToDelete.date), "d MMMM yyyy", {
                    locale: tr,
                  })} tarihli istisna kaldirilacak.`
                : "Bu istisna kaldirilacak."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOverrideToDelete(null)}>
              Iptal
            </AlertDialogCancel>
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
        onClose={() => {
          setAvailabilityModal({ open: false, mode: "create" });
          resetCalendarActiveState();
        }}
        mode={availabilityModal.mode}
        doctorId={doctorId}
        initialDayOfWeek={availabilityModal.dayOfWeek}
        initialStartTime={availabilityModal.startTime}
        initialEndTime={availabilityModal.endTime}
        slot={availabilityModal.slot}
        onDraftChange={setAvailabilityDraft}
        onSaved={() => {
          setAvailabilityModal({ open: false, mode: "create" });
          resetCalendarActiveState();
          void queryClient.invalidateQueries({ queryKey: ["availability", doctorId] });
          void queryClient.invalidateQueries({ queryKey: ["doctor-calendar", doctorId] });
        }}
      />

      <OverrideModal
        open={overrideModal.open}
        onClose={() => {
          setOverrideModal({ open: false, mode: "create" });
          resetCalendarActiveState();
        }}
        mode={overrideModal.mode}
        doctorId={doctorId}
        initialDate={overrideModal.initialDate}
        initialType={overrideModal.initialType}
        override={overrideModal.override}
        onSaved={() => {
          setOverrideModal({ open: false, mode: "create" });
          resetCalendarActiveState();
          void queryClient.invalidateQueries({
            queryKey: ["availability-overrides", doctorId],
          });
          void queryClient.invalidateQueries({ queryKey: ["doctor-calendar", doctorId] });
        }}
      />

      <AppointmentDetailSheet
        appointment={selectedAppointment}
        open={Boolean(selectedAppointment)}
        onClose={resetCalendarActiveState}
      />
    </div>
  );
}
