import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Views, type View } from "react-big-calendar";
import { CalendarDays, ChevronRight, PanelLeftOpen, Search } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { DoctorCalendar } from "@/components/calendar/DoctorCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { getDateFnsLocale, getIntlLocale } from "@/lib/date-localization";
import { cn } from "@/lib/utils";
import type { AvailabilitySlot } from "@/types/calendar";

const DOCTOR_AVATAR_PALETTE = [
  { bg: "#DBEAFE", text: "#1E40AF" },
  { bg: "#D1FAE5", text: "#065F46" },
  { bg: "#EDE9FE", text: "#5B21B6" },
  { bg: "#FEF3C7", text: "#92400E" },
  { bg: "#FCE7F3", text: "#9D174D" },
  { bg: "#FFEDD5", text: "#9A3412" },
  { bg: "#E0F2FE", text: "#075985" },
];

function getDoctorAvatarColor(id: string): { bg: string; text: string } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h * 31) + id.charCodeAt(i)) >>> 0;
  return DOCTOR_AVATAR_PALETTE[h % DOCTOR_AVATAR_PALETTE.length];
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

type DoctorFilter = "all" | "available";

interface DoctorSummary {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  specialization?: {
    name?: string | null;
  } | null;
  todaySlotCount: number;
  isAvailableToday: boolean;
}

function getDoctorDisplayName(
  doctor: Pick<DoctorSummary, "email" | "firstName" | "lastName">,
  fallback = "Doctor",
) {
  const fullName = `${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim();
  return fullName || doctor.email || fallback;
}

function getDoctorInitials(doctor: Pick<DoctorSummary, "email" | "firstName" | "lastName">) {
  const name = getDoctorDisplayName(doctor);
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function DoctorSelectionList({
  doctors,
  isLoading,
  selectedDoctorId,
  onSelect,
  t,
}: {
  doctors: DoctorSummary[];
  isLoading: boolean;
  selectedDoctorId: string | null;
  onSelect: (doctorId: string) => void;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-24 animate-pulse rounded-[22px] bg-muted/40" />
        ))}
      </div>
    );
  }

  if (!doctors.length) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{t.noDoctorsAvailable}</p>;
  }

  return (
    <div className="space-y-2.5 overflow-x-hidden">
      {doctors.map((doctor) => {
        const isSelected = selectedDoctorId === doctor.id;

        return (
          <button
            key={doctor.id}
            type="button"
            onClick={() => onSelect(doctor.id)}
            className={cn(
              "block w-full max-w-full overflow-hidden rounded-[22px] border px-3 py-3 text-left transition-all duration-200",
              isSelected
                ? "border-primary/30 bg-primary/8 shadow-soft"
                : "border-border/60 bg-background/70 hover:border-primary/20 hover:bg-accent/30",
            )}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              {(() => {
                const av = getDoctorAvatarColor(doctor.id);
                return (
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold select-none"
                    style={{ backgroundColor: av.bg, color: av.text }}
                  >
                    {getDoctorInitials(doctor)}
                  </div>
                );
              })()}

              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {getDoctorDisplayName(doctor)}
                  </p>
                  {doctor.isAvailableToday ? (
                    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold leading-none text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                      {doctor.todaySlotCount} {t.activeSlots}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground leading-none">
                      {t.today} {t.unavailable}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground mt-0.5">
                  {doctor.specialization?.name ?? t.specialtyNotSpecified}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SelectedDoctorContext({ doctor, t }: { doctor: DoctorSummary | null; t: ReturnType<typeof useLanguage>["t"] }) {
  if (!doctor) {
    return (
      <div className="rounded-[24px] border border-dashed border-border/60 bg-background/60 px-4 py-5 text-sm text-muted-foreground">
        {t.calendarViewDesc}
      </div>
    );
  }

  return (
    <div className="scheduler-rail-selected-doctor rounded-[24px] px-4 py-4">
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white shadow-soft"
          style={{ backgroundColor: "#65a98f" }}
        >
          {getDoctorInitials(doctor)}
        </div>

        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            {t.doctor}
          </p>
          <h2 className="truncate text-lg font-display font-semibold text-foreground">
            {getDoctorDisplayName(doctor)}
          </h2>
          <p className="truncate text-sm text-muted-foreground">
            {doctor.specialization?.name ?? t.specialtyNotSpecified}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="rounded-full border-border/60 bg-card text-foreground">
          {doctor.isAvailableToday ? `${doctor.todaySlotCount} ${t.activeSlots}` : `${t.today} ${t.unavailable}`}
        </Badge>
        <Badge
          variant="outline"
          className={cn(
            "rounded-full border",
            doctor.isAvailableToday
              ? "border-secondary/25 bg-secondary/10 text-secondary"
              : "border-border/60 bg-card text-muted-foreground",
          )}
        >
          {doctor.isAvailableToday ? `${t.today} ${t.available}` : `${t.today} ${t.unavailable}`}
        </Badge>
      </div>
    </div>
  );
}

function StaffSchedulerRail({
  calendarDate,
  calendarMonth,
  onDateSelect,
  onMonthChange,
  onToday,
  selectedDoctor,
  searchValue,
  onSearchChange,
  filterMode,
  onFilterModeChange,
  doctors,
  isLoading,
  selectedDoctorId,
  onSelectDoctor,
  t,
  lang,
  mobile = false,
}: {
  calendarDate: Date;
  calendarMonth: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  onToday: () => void;
  selectedDoctor: DoctorSummary | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterMode: DoctorFilter;
  onFilterModeChange: (value: DoctorFilter) => void;
  doctors: DoctorSummary[];
  isLoading: boolean;
  selectedDoctorId: string | null;
  onSelectDoctor: (doctorId: string) => void;
  t: ReturnType<typeof useLanguage>["t"];
  lang: ReturnType<typeof useLanguage>["lang"];
  mobile?: boolean;
}) {
  return (
    <div className="scheduler-rail-shell flex h-full min-h-0 flex-col overflow-hidden rounded-[32px]">
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <section className="border-b border-border/50 px-4 py-4">
          <div className="mb-2">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{t.doctorList}</h2>
          </div>

          <div className="scheduler-rail-card rounded-[26px] p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  {t.date}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {calendarDate.toLocaleDateString(getIntlLocale(lang), { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full border-[color:hsl(var(--calendar-sidebar-border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--calendar-mini-hover))]"
                onClick={onToday}
              >
                {t.today}
              </Button>
            </div>

            <Calendar
              mode="single"
              selected={calendarDate}
              month={calendarMonth}
              locale={getDateFnsLocale(lang)}
              onMonthChange={onMonthChange}
              onSelect={(date) => date && onDateSelect(date)}
              className="w-full rounded-[20px] bg-transparent p-0"
              classNames={{
                months: "w-full",
                month: "space-y-3",
                caption: "relative flex items-center justify-center px-8 pt-1",
                caption_label: "text-sm font-semibold text-foreground",
                nav_button:
                  "h-8 w-8 rounded-full border border-[color:hsl(var(--calendar-sidebar-border))] bg-[hsl(var(--card))] p-0 opacity-100 hover:bg-[hsl(var(--calendar-mini-hover))]",
                table: "w-full border-collapse",
                head_cell:
                  "w-9 text-[11px] font-medium uppercase tracking-[0.12em] text-[color:hsl(var(--calendar-muted))]",
                row: "mt-1.5 flex w-full",
                cell: "h-9 w-9 p-0 text-center text-sm",
                day:
                  "h-9 w-9 rounded-full p-0 text-sm font-medium text-foreground hover:bg-[hsl(var(--calendar-mini-hover))]",
                day_today: "bg-accent text-accent-foreground",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                day_outside: "text-[color:hsl(var(--calendar-disabled))] opacity-100",
                day_disabled: "text-[color:hsl(var(--calendar-disabled))] opacity-100",
              }}
            />
          </div>

          <div className="mt-4">
            <SelectedDoctorContext doctor={selectedDoctor} t={t} />
          </div>
        </section>

        <section className="flex flex-col px-4 pt-4 pb-3">
          <div className="shrink-0 space-y-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {t.doctorList}
              </p>
              <h2 className="text-lg font-display font-semibold text-foreground">{t.search}</h2>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={t.searchByNameOrSpecialty}
                className="rounded-full border-border/60 bg-background/70 pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={filterMode === "all" ? "default" : "outline"}
                className={cn(
                  "rounded-full",
                  filterMode === "all" ? "shadow-soft" : "border-border/60 bg-card",
                )}
                onClick={() => onFilterModeChange("all")}
              >
                {t.doctors}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filterMode === "available" ? "default" : "outline"}
                className={cn(
                  "rounded-full",
                  filterMode === "available" ? "shadow-soft" : "border-border/60 bg-card",
                )}
                onClick={() => onFilterModeChange("available")}
              >
                {t.today} {t.available}
              </Button>
            </div>
          </div>

          <div className="mt-3 rounded-[24px] border border-border/50 bg-background/55 overflow-hidden">
            <div className="overflow-y-auto overflow-x-hidden px-2 py-2 scrollbar-thin" style={{ maxHeight: "22rem" }}>
              <DoctorSelectionList
                doctors={doctors}
                isLoading={isLoading}
                selectedDoctorId={selectedDoctorId}
                onSelect={onSelectDoctor}
                t={t}
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function StaffDoctors() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const previousCompactLayoutRef = useRef(false);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [doctorAvailabilityMap, setDoctorAvailabilityMap] = useState<
    Record<string, Pick<DoctorSummary, "todaySlotCount" | "isAvailableToday">>
  >({});
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [isDoctorDrawerOpen, setIsDoctorDrawerOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState<View>(
    () => (typeof window !== "undefined" && window.innerWidth < 1024 ? Views.DAY : Views.WEEK),
  );
  const [hasAutoCompactView, setHasAutoCompactView] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [filterMode, setFilterMode] = useState<DoctorFilter>("all");
  const todayDayOfWeek = new Date().getDay();
  const todayDateString = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const syncCompactLayout = () => {
      setIsCompactLayout(mediaQuery.matches);
    };

    syncCompactLayout();
    mediaQuery.addEventListener("change", syncCompactLayout);

    return () => mediaQuery.removeEventListener("change", syncCompactLayout);
  }, []);

  const { data: doctors = [], isLoading } = useQuery<DoctorSummary[]>({
    queryKey: ["staff-doctors", todayDayOfWeek],
    queryFn: async () =>
      (await api.doctors.list() as DoctorSummary[]).map((doctor) => ({
        ...doctor,
        todaySlotCount: 0,
        isAvailableToday: false,
      })),
  });

  useEffect(() => {
    let isCancelled = false;

    setDoctorAvailabilityMap({});

    if (doctors.length === 0) {
      return;
    }

    void Promise.allSettled(
      doctors.map(async (doctor) => {
        const slots = await api.availability.getDoctorSlots(doctor.id, todayDateString);
        return {
          doctorId: doctor.id,
          todaySlotCount: slots.length,
          isAvailableToday: slots.length > 0,
        };
      }),
    ).then((results) => {
      if (isCancelled) {
        return;
      }

      const nextAvailabilityMap = doctors.reduce<
        Record<string, Pick<DoctorSummary, "todaySlotCount" | "isAvailableToday">>
      >((accumulator, doctor) => {
        accumulator[doctor.id] = {
          todaySlotCount: 0,
          isAvailableToday: false,
        };
        return accumulator;
      }, {});

      for (const result of results) {
        if (result.status !== "fulfilled") {
          continue;
        }

        nextAvailabilityMap[result.value.doctorId] = {
          todaySlotCount: result.value.todaySlotCount,
          isAvailableToday: result.value.isAvailableToday,
        };
      }

      setDoctorAvailabilityMap(nextAvailabilityMap);
    });

    return () => {
      isCancelled = true;
    };
  }, [doctors, todayDateString]);

  useEffect(() => {
    if (!selectedDoctorId && doctors.length > 0) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  useEffect(() => {
    const wasCompactLayout = previousCompactLayoutRef.current;

    if (isCompactLayout && !wasCompactLayout) {
      if (calendarView === Views.WEEK) {
        setCalendarView(Views.DAY);
        setHasAutoCompactView(true);
      }
    }

    if (!isCompactLayout && wasCompactLayout && hasAutoCompactView && calendarView === Views.DAY) {
      setCalendarView(Views.WEEK);
      setHasAutoCompactView(false);
    }

    if (!isCompactLayout && wasCompactLayout && (!hasAutoCompactView || calendarView !== Views.DAY)) {
      setHasAutoCompactView(false);
    }

    previousCompactLayoutRef.current = isCompactLayout;
  }, [calendarView, hasAutoCompactView, isCompactLayout]);

  const filteredDoctors = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLocaleLowerCase(getIntlLocale(lang));

    return doctors
      .map((doctor) => ({
        ...doctor,
        ...doctorAvailabilityMap[doctor.id],
      }))
      .filter((doctor) => {
        if (filterMode === "available" && !doctor.isAvailableToday) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        const haystack = [
          getDoctorDisplayName(doctor),
          doctor.specialization?.name ?? "",
          doctor.email ?? "",
        ]
          .join(" ")
          .toLocaleLowerCase(getIntlLocale(lang));

        return haystack.includes(normalizedQuery);
      });
  }, [doctorAvailabilityMap, doctors, filterMode, lang, searchValue]);

  const selectedDoctor = useMemo(
    () =>
      doctors
        .map((doctor) => ({
          ...doctor,
          ...doctorAvailabilityMap[doctor.id],
        }))
        .find((doctor) => doctor.id === selectedDoctorId) ?? null,
    [doctorAvailabilityMap, doctors, selectedDoctorId],
  );

  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    setIsDoctorDrawerOpen(false);
  };

  const handleCalendarDateChange = (date: Date) => {
    setCalendarDate(date);
    setCalendarMonth(date);
  };

  const handleToday = () => {
    const today = new Date();
    setCalendarDate(today);
    setCalendarMonth(today);
  };

  const handleCalendarViewChange = (nextView: View) => {
    setCalendarView(nextView);
    setHasAutoCompactView(false);
  };

  return (
    <AppLayout mainWidth="full" mainClassName="box-border flex h-[calc(100dvh-4rem)] min-h-0 overflow-hidden py-3 sm:py-4 px-3 sm:px-4">
      <motion.div
        initial="hidden"
        animate="visible"
        className="relative flex min-h-0 w-full flex-1 flex-col gap-5 overflow-hidden"
      >
        <div className="grid min-h-0 flex-1 gap-5 overflow-hidden lg:grid-cols-[292px_minmax(0,1fr)] xl:grid-cols-[308px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]">
          <motion.aside
            custom={0}
            variants={fadeUp}
            className="hidden min-h-0 shrink-0 overflow-hidden border-r border-border/40 lg:block"
          >
            <div className="flex h-full min-h-0 flex-col">
              <StaffSchedulerRail
                calendarDate={calendarDate}
                calendarMonth={calendarMonth}
                onDateSelect={handleCalendarDateChange}
                onMonthChange={setCalendarMonth}
                onToday={handleToday}
                selectedDoctor={selectedDoctor}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                filterMode={filterMode}
                onFilterModeChange={setFilterMode}
                doctors={filteredDoctors}
                isLoading={isLoading}
                selectedDoctorId={selectedDoctorId}
                onSelectDoctor={handleDoctorSelect}
                t={t}
                lang={lang}
              />
            </div>
          </motion.aside>

          <motion.section
            custom={1}
            variants={fadeUp}
            className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden"
          >
            {isCompactLayout ? (
              <Card className="shrink-0 rounded-[28px] border-border/60 bg-card/95 shadow-soft lg:hidden">
                <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {t.doctorList}
                    </p>
                    <h2 className="truncate text-lg font-display font-semibold text-foreground">
                      {selectedDoctor ? getDoctorDisplayName(selectedDoctor, t.doctor) : t.doctor}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{calendarDate.toLocaleDateString(getIntlLocale(lang), { day: "numeric", month: "long", year: "numeric" })}</span>
                      {selectedDoctor ? <span className="text-border">/</span> : null}
                      {selectedDoctor ? (
                        <span>{selectedDoctor.specialization?.name ?? t.specialtyNotSpecified}</span>
                      ) : null}
                      {calendarView ? <span className="rounded-full bg-accent/70 px-2 py-0.5 text-[11px] font-medium text-foreground/80">{calendarView === Views.DAY ? t.day : calendarView === Views.WEEK ? t.week : calendarView === Views.MONTH ? t.month : t.agenda}</span> : null}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl border-border/60 bg-card md:w-auto"
                    onClick={() => setIsDoctorDrawerOpen(true)}
                  >
                    <PanelLeftOpen className="mr-2 h-4 w-4" />
                    {t.doctorList}
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {!selectedDoctor && !isLoading ? (
              <Card className="flex min-h-0 flex-1 rounded-[32px] border-border/60 bg-card/95 shadow-soft">
                <CardContent className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
                  <CalendarDays className="mb-4 h-10 w-10 text-primary" />
                  <h2 className="text-xl font-display font-semibold">{t.calendarViewTitle}</h2>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">{t.calendarViewDesc}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-6 rounded-xl lg:hidden"
                    onClick={() => setIsDoctorDrawerOpen(true)}
                  >
                    {t.doctorList}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : selectedDoctor ? (
              <div className="min-h-0 flex-1 overflow-hidden">
                <DoctorCalendar
                  doctorId={selectedDoctor.id}
                  mode="staff"
                  doctorName={getDoctorDisplayName(selectedDoctor, t.doctor)}
                  specializationName={selectedDoctor.specialization?.name ?? t.specialtyNotSpecified}
                  defaultDuration={user?.default_appointment_duration ?? 30}
                  calendarDate={calendarDate}
                  onCalendarDateChange={handleCalendarDateChange}
                  calendarView={calendarView}
                  onCalendarViewChange={handleCalendarViewChange}
                />
              </div>
            ) : (
              <Card className="flex min-h-0 flex-1 rounded-[32px] border-border/60 bg-card/95 shadow-soft">
                <CardContent className="flex min-h-0 flex-1 items-center justify-center">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    {t.loading}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.section>
        </div>
      </motion.div>

      <Drawer open={isDoctorDrawerOpen} onOpenChange={setIsDoctorDrawerOpen}>
        <DrawerContent className="max-h-[92vh] overflow-hidden rounded-t-[28px] lg:hidden">
          <DrawerHeader>
            <DrawerTitle>{t.doctorList}</DrawerTitle>
            <DrawerDescription>
              {t.calendarViewDesc}
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
            <StaffSchedulerRail
              calendarDate={calendarDate}
              calendarMonth={calendarMonth}
              onDateSelect={handleCalendarDateChange}
              onMonthChange={setCalendarMonth}
              onToday={handleToday}
              selectedDoctor={selectedDoctor}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              filterMode={filterMode}
              onFilterModeChange={setFilterMode}
              doctors={filteredDoctors}
              isLoading={isLoading}
              selectedDoctorId={selectedDoctorId}
              onSelectDoctor={handleDoctorSelect}
              t={t}
              lang={lang}
              mobile
            />
          </div>
        </DrawerContent>
      </Drawer>
    </AppLayout>
  );
}
