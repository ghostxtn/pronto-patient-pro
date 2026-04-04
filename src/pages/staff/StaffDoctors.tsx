import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, Stethoscope } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { DoctorCalendar } from "@/components/calendar/DoctorCalendar";
import api from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getClinicNowParts } from "@/utils/calendarUtils";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function getDoctorDisplayName(doctor: any) {
  const fullName = `${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim();
  return fullName || doctor.email || "Doktor";
}

export default function StaffDoctors() {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const todayDayOfWeek = getClinicNowParts().dayOfWeek;

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["staff-doctors", todayDayOfWeek],
    queryFn: async () => {
      const doctors = await api.doctors.list({ status: "active" });
      const doctorAvailability = await Promise.all(
        doctors.map(async (doctor: any) => {
          const availability = await api.availability.listByDoctor(doctor.id);
          const todaySlots = availability.filter(
            (slot: any) => slot.day_of_week === todayDayOfWeek && slot.is_active !== false,
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

  const selectedDoctor = useMemo(
    () => doctors.find((doctor: any) => doctor.id === selectedDoctorId) ?? null,
    [doctors, selectedDoctorId],
  );

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold text-slate-950">Randevu Operasyon Alani</h1>
          <p className="mt-1 max-w-3xl text-muted-foreground">
            Doktor secimi, aktif takvim ve gunluk planlama ayni calisma alani icinde birlikte ilerler.
          </p>
        </motion.div>

        <div className="overflow-hidden rounded-[36px] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_18%,#ffffff_100%)] shadow-[0_28px_64px_-34px_rgba(15,23,42,0.28)]">
          <div className="border-b border-slate-200/80 px-6 py-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Ic Takvim
                </div>
                <div className="mt-2 text-2xl font-display font-bold text-slate-950">
                  Klinigin ic takvim merkezi
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  Sol rayda doktor secimi, orta rayda baglam, ana alanda gercek takvim yuzeyi.
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-right shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Aktif gorunum
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedDoctor ? getDoctorDisplayName(selectedDoctor) : "Doktor secin"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-0 xl:grid-cols-[320px_minmax(0,1fr)]">
          <motion.div custom={1} variants={fadeUp}>
            <div className="h-full border-r border-slate-200/80 bg-slate-50/70">
              <div className="border-b border-slate-200/80 px-5 py-5">
                <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Hekim listesi
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Operasyon takvimi acmak icin aktif doktor secin.
                </p>
              </div>
              <div className="max-h-[1080px] overflow-y-auto px-4 py-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
                    ))}
                  </div>
                ) : !doctors.length ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Doktor bulunmuyor</p>
                ) : (
                  <div className="space-y-2.5">
                    {doctors.map((doctor: any) => (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => setSelectedDoctorId(doctor.id)}
                        className={cn(
                          "w-full rounded-[24px] border px-4 py-4 text-left transition-all",
                          selectedDoctorId === doctor.id
                            ? "border-primary/40 bg-white shadow-[0_18px_34px_-24px_rgba(37,99,235,0.45)] ring-1 ring-primary/10"
                            : "border-slate-200 bg-white/75 hover:border-slate-300 hover:bg-white",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "inline-flex h-2.5 w-2.5 rounded-full",
                                doctor.isAvailableToday ? "bg-emerald-500" : "bg-slate-300",
                              )} />
                              <p className="truncate text-sm font-semibold text-slate-900">{getDoctorDisplayName(doctor)}</p>
                            </div>
                            <p className="mt-1 truncate text-xs text-muted-foreground">
                              {doctor.specialization?.name ?? "Brans belirtilmedi"}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium">
                                Bugun {doctor.todaySlotCount} slot
                              </span>
                              {selectedDoctorId === doctor.id ? (
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 font-medium text-primary">
                                  Secili
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full border px-2.5 py-1",
                              doctor.isAvailableToday
                                ? "bg-success/15 text-success border-success/30"
                                : "bg-slate-100 text-muted-foreground border-slate-200",
                            )}
                          >
                            {doctor.isAvailableToday ? "Bugun aktif" : "Bugun pasif"}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div custom={2} variants={fadeUp} className="bg-white">
            {!selectedDoctor ? (
              <div className="flex min-h-[720px] flex-col items-center justify-center px-6 text-center">
                  <CalendarDays className="mb-4 h-10 w-10 text-primary" />
                  <h2 className="text-xl font-display font-semibold text-slate-950">Takvim hazir</h2>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Calisma alanini acmak icin listeden bir doktor secin.
                  </p>
              </div>
            ) : (
              <div className="p-4 xl:p-5">
                <DoctorCalendar
                  doctorId={selectedDoctor.id}
                  variant="staff"
                  doctorName={getDoctorDisplayName(selectedDoctor)}
                  doctorSubtitle={selectedDoctor.specialization?.name ?? "Brans belirtilmedi"}
                />
              </div>
            )}
          </motion.div>
        </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
