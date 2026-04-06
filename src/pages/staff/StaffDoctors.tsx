import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Views, type View } from "react-big-calendar";
import { CalendarDays, ChevronRight, PanelLeftOpen, Search, Stethoscope } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { DoctorCalendar } from "@/components/calendar/DoctorCalendar";
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
import { cn } from "@/lib/utils";
import api from "@/services/api";
import type { AvailabilitySlot } from "@/types/calendar";

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

function getDoctorDisplayName(doctor: Pick<DoctorSummary, "email" | "firstName" | "lastName">) {
  const fullName = `${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim();
  return fullName || doctor.email || "Doktor";
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
}: {
  doctors: DoctorSummary[];
  isLoading: boolean;
  selectedDoctorId: string | null;
  onSelect: (doctorId: string) => void;
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
    return <p className="py-8 text-center text-sm text-muted-foreground">Filtreyle eslesen doktor bulunmuyor.</p>;
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
                ? "border-primary/20 bg-primary/10 shadow-soft"
                : "border-border/60 bg-background/70 hover:border-primary/15 hover:bg-accent/35",
            )}
          >
            <div className="flex items-start gap-2.5 overflow-hidden">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-[11px] font-semibold",
                  isSelected
                    ? "border-primary/20 bg-primary/15 text-primary"
                    : "border-border/60 bg-card text-foreground",
                )}
              >
                {getDoctorInitials(doctor)}
              </div>

              <div className="min-w-0 flex-1 space-y-1.5 overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {getDoctorDisplayName(doctor)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {doctor.specialization?.name ?? "Brans belirtilmedi"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none",
                      doctor.isAvailableToday
                        ? "border-secondary/25 bg-secondary/10 text-secondary"
                        : "border-border/60 bg-card text-muted-foreground",
                    )}
                  >
                    {doctor.isAvailableToday ? "Aktif" : "Pasif"}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="max-w-full truncate rounded-full bg-accent/70 px-2 py-0.5 text-[10px] font-medium text-foreground/80">
                    {doctor.todaySlotCount} bugunku slot
                  </span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SelectedDoctorContext({ doctor }: { doctor: DoctorSummary | null }) {
  if (!doctor) {
    return (
      <div className="rounded-[24px] border border-dashed border-border/60 bg-background/60 px-4 py-5 text-sm text-muted-foreground">
        Takvimi odaga almak icin bir doktor secin.
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-primary/15 bg-primary/5 px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-card text-sm font-semibold text-primary shadow-soft">
          {getDoctorInitials(doctor)}
        </div>

        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary">
            Secili doktor
          </p>
          <h2 className="truncate text-lg font-display font-semibold text-foreground">
            {getDoctorDisplayName(doctor)}
          </h2>
          <p className="truncate text-sm text-muted-foreground">
            {doctor.specialization?.name ?? "Brans belirtilmedi"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="rounded-full border-border/60 bg-card text-foreground">
          {doctor.todaySlotCount} aktif slot
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
          {doctor.isAvailableToday ? "Bugun musait" : "Bugun pasif"}
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
  mobile?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-border/60 bg-card/95 shadow-soft">
      <section className="border-b border-border/50 px-4 py-4">
        <div className="mb-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Sol ray
          </p>
          <h2 className="text-lg font-display font-semibold text-foreground">Doktor odagi</h2>
        </div>

        <div className="rounded-[26px] border border-border/60 bg-background/72 p-3 shadow-soft">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Tarih gezgini
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {calendarDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full border-border/60 bg-card"
              onClick={onToday}
            >
              Bugun
            </Button>
          </div>

          <Calendar
            mode="single"
            selected={calendarDate}
            month={calendarMonth}
            onMonthChange={onMonthChange}
            onSelect={(date) => date && onDateSelect(date)}
            className="w-full rounded-[20px] bg-transparent p-0"
            classNames={{
              months: "w-full",
              month: "space-y-3",
              caption: "relative flex items-center justify-center px-8 pt-1",
              caption_label: "text-sm font-semibold text-foreground",
              nav_button: "h-8 w-8 rounded-full border border-border/60 bg-card p-0 opacity-100 hover:bg-accent",
              table: "w-full border-collapse",
              head_cell: "w-9 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground",
              row: "mt-1.5 flex w-full",
              cell: "h-9 w-9 p-0 text-center text-sm",
              day: "h-9 w-9 rounded-full p-0 text-sm font-medium text-foreground hover:bg-accent/70",
              day_today: "bg-accent text-accent-foreground",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            }}
          />
        </div>

        <div className="mt-4">
          <SelectedDoctorContext doctor={selectedDoctor} />
        </div>
      </section>

      <section className="flex min-h-0 flex-1 flex-col px-4 py-4">
        <div className="shrink-0 space-y-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Doktorlar
            </p>
            <h2 className="text-lg font-display font-semibold text-foreground">Arama ve filtreler</h2>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Doktor veya brans ara"
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
              Tum doktorlar
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
              Bugun musait
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-border/50 bg-background/55",
            mobile ? "max-h-[40vh]" : "max-h-[25rem]",
          )}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-2">
            <DoctorSelectionList
              doctors={doctors}
              isLoading={isLoading}
              selectedDoctorId={selectedDoctorId}
              onSelect={onSelectDoctor}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function StaffDoctors() {
  const previousCompactLayoutRef = useRef(false);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
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
    queryFn: async () => {
      const doctors = await api.doctors.list() as DoctorSummary[];
      const doctorAvailability = await Promise.all(
        doctors.map(async (doctor) => {
          const availability = await api.availability.listByDoctor(doctor.id) as AvailabilitySlot[];
          const todaySlots = availability.filter(
            (slot) => slot.day_of_week === todayDayOfWeek && slot.is_active !== false,
          );

          return {
            ...doctor,
            todaySlotCount: todaySlots.length,
            isAvailableToday: todaySlots.length > 0,
          };
        }),
      );

      return doctorAvailability;
    },
  });

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
    const normalizedQuery = searchValue.trim().toLocaleLowerCase("tr-TR");

    return doctors.filter((doctor) => {
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
        .toLocaleLowerCase("tr-TR");

      return haystack.includes(normalizedQuery);
    });
  }, [doctors, filterMode, searchValue]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === selectedDoctorId) ?? null,
    [doctors, selectedDoctorId],
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
    <AppLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        className="relative left-1/2 w-[min(calc(100vw-1.5rem),1520px)] -translate-x-1/2 space-y-5 md:w-[min(calc(100vw-2.5rem),1520px)]"
      >
        <motion.div custom={0} variants={fadeUp}>
          <div className="rounded-[28px] border border-border/60 bg-card/80 px-4 py-4 shadow-soft">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Stethoscope className="h-3.5 w-3.5" />
              Staff scheduler
            </div>
            <div className="mt-3">
              <h1 className="text-[1.9rem] font-display font-bold tracking-[-0.03em] text-foreground">
                Doktor Takvimi
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Tarih gezinmesi, doktor secimi ve operasyon takvimi ayni urun dilinde bir araya gelir.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid items-start gap-5 lg:grid-cols-[292px_minmax(0,1fr)] xl:grid-cols-[308px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]">
          <motion.aside custom={1} variants={fadeUp} className="hidden lg:block">
            <div className="sticky top-6 max-h-[calc(100vh-8.5rem)]">
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
              />
            </div>
          </motion.aside>

          <motion.section custom={2} variants={fadeUp} className="min-w-0 space-y-4">
            {isCompactLayout ? (
              <Card className="rounded-[28px] border-border/60 bg-card/95 shadow-soft lg:hidden">
                <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Doktor rayi
                    </p>
                    <h2 className="truncate text-lg font-display font-semibold text-foreground">
                      {selectedDoctor ? getDoctorDisplayName(selectedDoctor) : "Doktor secimi bekleniyor"}
                    </h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{calendarDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</span>
                      {selectedDoctor ? <span className="text-border">/</span> : null}
                      {selectedDoctor ? (
                        <span>{selectedDoctor.specialization?.name ?? "Brans belirtilmedi"}</span>
                      ) : null}
                      {calendarView ? <span className="rounded-full bg-accent/70 px-2 py-0.5 text-[11px] font-medium text-foreground/80">{calendarView === Views.DAY ? "Gun odagi" : calendarView === Views.WEEK ? "Hafta" : calendarView === Views.MONTH ? "Ay" : "Ajanda"}</span> : null}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl border-border/60 bg-card md:w-auto"
                    onClick={() => setIsDoctorDrawerOpen(true)}
                  >
                    <PanelLeftOpen className="mr-2 h-4 w-4" />
                    Doktor rayini ac
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {!selectedDoctor && !isLoading ? (
              <Card className="rounded-[32px] border-border/60 bg-card/95 shadow-soft">
                <CardContent className="flex min-h-[560px] flex-col items-center justify-center text-center">
                  <CalendarDays className="mb-4 h-10 w-10 text-primary" />
                  <h2 className="text-xl font-display font-semibold">Takvim hazir</h2>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Takvimi acmak icin bir doktor secin.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-6 rounded-xl lg:hidden"
                    onClick={() => setIsDoctorDrawerOpen(true)}
                  >
                    Doktor listesini ac
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : selectedDoctor ? (
              <DoctorCalendar
                doctorId={selectedDoctor.id}
                mode="staff"
                doctorName={getDoctorDisplayName(selectedDoctor)}
                specializationName={selectedDoctor.specialization?.name ?? "Brans belirtilmedi"}
                calendarDate={calendarDate}
                onCalendarDateChange={handleCalendarDateChange}
                calendarView={calendarView}
                onCalendarViewChange={handleCalendarViewChange}
              />
            ) : (
              <Card className="rounded-[32px] border-border/60 bg-card/95 shadow-soft">
                <CardContent className="flex min-h-[560px] items-center justify-center">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Doktor listesi yukleniyor...
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
            <DrawerTitle>Doktor rayi</DrawerTitle>
            <DrawerDescription>
              Mini takvim, secili doktor, filtreler ve doktor listesi burada kalir; ana takvim yuzeyi ana sahne olarak acikta kalir.
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
              mobile
            />
          </div>
        </DrawerContent>
      </Drawer>
    </AppLayout>
  );
}
