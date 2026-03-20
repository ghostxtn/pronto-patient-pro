import { useMemo, useState } from "react";
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
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  parse,
  setHours,
  setMinutes,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";
import { tr } from "date-fns/locale";
import { Pencil, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AvailabilityModal } from "@/components/calendar/AvailabilityModal";
import { OverrideModal } from "@/components/calendar/OverrideModal";
import { AppointmentDetailSheet } from "@/components/appointments/AppointmentDetailSheet";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Appointment,
  AvailabilitySlot,
  AvailabilityOverride,
  CalendarEvent,
} from "@/types/calendar";
import { appointmentsToEvents, overridesToEvents } from "@/utils/calendarUtils";

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

interface CustomToolbarProps extends ToolbarProps<CalendarEvent, object> {
  onManageAvailability: () => void;
}

interface CalendarHeaderProps {
  date: Date;
  label: string;
  onContextMenu: (event: React.MouseEvent<HTMLElement>, date: Date) => void;
}

const toolbarViewLabels = {
  [Views.MONTH]: "Ay",
  [Views.WEEK]: "Hafta",
  [Views.DAY]: "Gun",
  [Views.AGENDA]: "Ajanda",
} as const;

const toolbarViews = [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA] as const;

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
  return normalizedDay * 10000 + Number(slot.start_time.slice(0, 2)) * 100 + Number(slot.start_time.slice(3, 5));
}

function getOverrideBadge(type: AvailabilityOverride["type"]) {
  return type === "blackout"
    ? { label: "Blackout", className: "border-red-200 bg-red-50 text-red-700" }
    : { label: "Özel Saat", className: "border-yellow-200 bg-yellow-50 text-yellow-700" };
}

const CustomToolbar = ({
  label,
  onNavigate,
  onView,
  view,
  onManageAvailability,
}: CustomToolbarProps) => (
  <div className="mb-2 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
    <Button
      type="button"
      variant="outline"
      className="rounded-xl"
      onClick={onManageAvailability}
    >
      <Settings2 className="h-4 w-4" />
      Musaitligi Yonet
    </Button>

    <div className="flex items-center gap-2">
      <button
        onClick={() => onNavigate("PREV")}
        className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
        type="button"
      >
        {"<"}
      </button>
      <span className="min-w-[160px] text-center text-base font-semibold text-gray-800">
        {label}
      </span>
      <button
        onClick={() => onNavigate("NEXT")}
        className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100"
        type="button"
      >
        {">"}
      </button>
    </div>

    <div className="flex gap-1">
      {toolbarViews.map((toolbarView) => (
        <button
          key={toolbarView}
          onClick={() => {
            if (toolbarView === Views.DAY) {
              onNavigate("TODAY");
            }
            onView(toolbarView);
          }}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            view === toolbarView
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
          type="button"
        >
          {toolbarViewLabels[toolbarView]}
        </button>
      ))}
    </div>
  </div>
);

const CalendarHeader = ({ date, label, onContextMenu }: CalendarHeaderProps) => (
  <div
    onContextMenu={(event) => onContextMenu(event, date)}
    className="cursor-context-menu rounded-md px-1 py-0.5"
    title="Sağ tıklayarak istisna ekleyin"
  >
    {label}
  </div>
);

function toApiDate(date: Date) {
  return format(date, "yyyy-MM-dd");
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
        rangeStart: startOfWeek(date, { weekStartsOn: 1, locale: tr }),
        rangeEnd: endOfWeek(date, { weekStartsOn: 1, locale: tr }),
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

export function DoctorCalendar({ doctorId }: DoctorCalendarProps) {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
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
  const [contextMenuState, setContextMenuState] = useState<{
    open: boolean;
    x: number;
    y: number;
    date?: Date;
  }>({ open: false, x: 0, y: 0 });

  const { rangeStart, rangeEnd } = useMemo(
    () => getDateRange(currentDate, view),
    [currentDate, view],
  );
  const overrideRangeStart = useMemo(() => format(subDays(new Date(), 30), "yyyy-MM-dd"), []);
  const overrideRangeEnd = useMemo(() => format(addDays(new Date(), 365), "yyyy-MM-dd"), []);

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
        patient: {
          id: appointment.patient?.id ?? "",
          firstName: appointment.patient?.firstName ?? "",
          lastName: appointment.patient?.lastName ?? "",
        },
      }));

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
      toast.success("İstisna silindi");
      setOverrideToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["availability-overrides", doctorId] });
      await queryClient.invalidateQueries({ queryKey: ["doctor-calendar", doctorId] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "İstisna silinemedi");
    },
  });

  const events = useMemo(() => {
    if (!data) {
      return [];
    }

    const appointmentEvents = appointmentsToEvents(data.appointments);
    const overrideEvents = overridesToEvents(data.overrides);
    return [...overrideEvents, ...appointmentEvents];
  }, [data]);

  const foregroundEvents = useMemo(() => events, [events]);

  const sortedAvailabilitySlots = useMemo(
    () => [...availabilitySlots].sort((left, right) => getAvailabilitySortValue(left) - getAvailabilitySortValue(right)),
    [availabilitySlots],
  );
  const sortedOverrides = useMemo(
    () => [...overrideList].sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime()),
    [overrideList],
  );

  const eventPropGetter: EventPropGetter<CalendarEvent> = (event) => {
    if (event.type === "appointment") {
      return {
        className: "border-blue-400 bg-blue-100 text-blue-800",
        style: {
          backgroundColor: "#dbeafe",
          borderColor: "#60a5fa",
          color: "#1e40af",
          cursor: "pointer",
          zIndex: 1,
        },
      };
    }

    if (event.type === "blackout") {
      return {
        className: "border-red-400 bg-red-100 text-red-600",
        style: {
          backgroundColor: "#fecaca",
          borderColor: "#f87171",
          color: "#991b1b",
          cursor: "pointer",
          zIndex: 1,
        },
      };
    }

    if (event.type === "custom_hours") {
      return {
        className: "border-yellow-400 bg-yellow-100 text-yellow-800",
        style: {
          backgroundColor: "#fef3c7",
          borderColor: "#facc15",
          color: "#854d0e",
          cursor: "pointer",
          zIndex: 1,
        },
      };
    }
    return {};
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.type === "appointment") {
      setSelectedAppointment(event.resource as Appointment);
      return;
    }

    if (event.type === "blackout") {
      const override = event.resource as AvailabilityOverride;
      toast.info(override.reason ?? "Kapali");
      return;
    }

    if (event.type === "custom_hours") {
      const override = event.resource as AvailabilityOverride;
      toast.info(override.reason ?? "Özel saat tanımlı");
    }
  };

  const handleHeaderContextMenu = (event: React.MouseEvent<HTMLElement>, date: Date) => {
    event.preventDefault();
    setContextMenuState({
      open: true,
      x: event.clientX,
      y: event.clientY,
      date,
    });
  };

  const handleOpenOverrideCreate = (date: Date, type: "blackout" | "custom_hours") => {
    setContextMenuState({ open: false, x: 0, y: 0 });
    setOverrideModal({
      open: true,
      mode: "create",
      initialDate: format(date, "yyyy-MM-dd"),
      initialType: type,
    });
  };

  const isLoading = isAvailabilityLoading || isCalendarLoading;
  const isError = isAvailabilityError || isCalendarError;
  const error = availabilityError ?? calendarError;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-72 rounded-xl" />
        <Skeleton className="h-[640px] w-full rounded-2xl" />
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
    <div className="space-y-4">
      <div>
        <div>
          <h2 className="font-display text-2xl font-bold">Haftalik Takvim</h2>
          <p className="text-sm text-muted-foreground">
            Musait saatler, randevular ve gunluk istisnalar tek gorunumde.
          </p>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 shadow-card">
        <BigCalendar
          components={{
            header: ({ date, label }) => (
              <CalendarHeader date={date} label={label} onContextMenu={handleHeaderContextMenu} />
            ),
            dateHeader: ({ date, label }) => (
              <CalendarHeader date={date} label={String(label)} onContextMenu={handleHeaderContextMenu} />
            ),
            toolbar: (toolbarProps) => (
              <CustomToolbar
                {...toolbarProps}
                onManageAvailability={() => setIsAvailabilitySheetOpen(true)}
              />
            ),
          }}
          localizer={localizer}
          events={foregroundEvents}
          defaultView={Views.WEEK}
          view={view}
          date={currentDate}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 720 }}
          messages={calendarMessages}
          eventPropGetter={eventPropGetter}
          slotPropGetter={(date) => {
            const dateStr = date.toISOString().split("T")[0];
            const isBlackedOut = (data?.overrides ?? []).some(
              (override) => override.date === dateStr && override.type === "blackout",
            );
            if (isBlackedOut) {
              return {};
            }

            const dow = date.getDay();
            const timeStr = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
            const inSlot = availabilitySlots.some(
              (slot) =>
                slot.day_of_week === dow &&
                slot.is_active &&
                timeStr >= slot.start_time.slice(0, 5) &&
                timeStr < slot.end_time.slice(0, 5),
            );
            return inSlot ? { style: { backgroundColor: "#dcfce7", cursor: "pointer" } } : {};
          }}
          onNavigate={setCurrentDate}
          onView={setView}
          onDrillDown={(date, nextView) => {
            void nextView;
            setCurrentDate(date);
            setView(Views.DAY);
          }}
          getDrilldownView={() => Views.DAY}
          onSelectSlot={(slotInfo) => {
            if (view === Views.MONTH) {
              setCurrentDate(slotInfo.start);
              setView(Views.DAY);
              return;
            }

            const clickedDay = slotInfo.start.getDay();
            const clickedTime = `${String(slotInfo.start.getHours()).padStart(2, "0")}:${String(slotInfo.start.getMinutes()).padStart(2, "0")}`;
            const endTime = `${String(slotInfo.end.getHours()).padStart(2, "0")}:${String(slotInfo.end.getMinutes()).padStart(2, "0")}`;
            const existingSlot = availabilitySlots.find(
              (slot) =>
                slot.day_of_week === clickedDay &&
                slot.is_active &&
                clickedTime >= slot.start_time.slice(0, 5) &&
                clickedTime < slot.end_time.slice(0, 5),
            );

            if (existingSlot) {
              setAvailabilityModal({
                open: true,
                mode: "edit",
                slot: existingSlot,
              });
              return;
            }

            setAvailabilityModal({
              open: true,
              mode: "create",
              dayOfWeek: clickedDay,
              startTime: clickedTime,
              endTime,
            });
          }}
          onSelectEvent={handleSelectEvent}
          selectable
          popup
          culture="tr"
          step={30}
          timeslots={2}
          min={setMinutes(setHours(new Date(), 6), 0)}
          max={setMinutes(setHours(new Date(), 23), 0)}
          drilldownView={Views.DAY}
          dayLayoutAlgorithm="no-overlap"
        />
      </div>

      <DropdownMenu
        open={contextMenuState.open}
        onOpenChange={(open) => setContextMenuState((current) => ({ ...current, open }))}
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
          className="w-52"
          style={{ position: "fixed", left: contextMenuState.x, top: contextMenuState.y }}
        >
          <DropdownMenuItem
            onClick={() => contextMenuState.date && handleOpenOverrideCreate(contextMenuState.date, "blackout")}
          >
            Bu günü kapat
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => contextMenuState.date && handleOpenOverrideCreate(contextMenuState.date, "custom_hours")}
          >
            Özel saat belirle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet open={isAvailabilitySheetOpen} onOpenChange={setIsAvailabilitySheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Musaitligi Yonet</SheetTitle>
            <SheetDescription>
              Haftalik musaitlik slotlarini burada duzenleyebilir, aktiflik durumunu degistirebilir veya yeni slot ekleyebilirsiniz.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-4 rounded-2xl border border-border/70 bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Haftalık Slotlar</h3>
                  <p className="text-sm text-muted-foreground">
                    Düzenli çalışma saatlerinizi yönetin.
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
                  ＋ Yeni Slot Ekle
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
                                return queryClient.invalidateQueries({ queryKey: ["availability", doctorId] });
                              })
                              .then(() => queryClient.invalidateQueries({ queryKey: ["doctor-calendar", doctorId] }))
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
                          <Pencil className="h-4 w-4" />
                          Duzenle
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          className="rounded-xl"
                          onClick={() => setSlotToDelete(slot)}
                        >
                          <Trash2 className="h-4 w-4" />
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
                  <h3 className="font-semibold">İstisnalar</h3>
                  <p className="text-sm text-muted-foreground">
                    Son 30 gün ve gelecek için planlanan özel kapanış veya mesai istisnaları.
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
                  ＋ İstisna Ekle
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
                              {format(new Date(override.date), "d MMMM yyyy", { locale: tr })}
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
                              <Pencil className="h-4 w-4" />
                              Düzenle
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              className="rounded-xl"
                              onClick={() => setOverrideToDelete(override)}
                            >
                              <Trash2 className="h-4 w-4" />
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
                  Tanımlı istisna bulunmuyor.
                </div>
              )}
            </div>

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
                  <AlertDialogTitle>İstisna silinsin mi?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {overrideToDelete
                      ? `${format(new Date(overrideToDelete.date), "d MMMM yyyy", { locale: tr })} tarihli istisna kaldırılacak.`
                      : "Bu istisna kaldırılacak."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setOverrideToDelete(null)}>İptal</AlertDialogCancel>
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
          </div>
        </SheetContent>
      </Sheet>

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
          void queryClient.invalidateQueries({ queryKey: ["availability", doctorId] });
          void queryClient.invalidateQueries({ queryKey: ["doctor-calendar", doctorId] });
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
          void queryClient.invalidateQueries({ queryKey: ["availability-overrides", doctorId] });
          void queryClient.invalidateQueries({ queryKey: ["doctor-calendar", doctorId] });
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
