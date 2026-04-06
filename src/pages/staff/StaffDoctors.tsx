import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Stethoscope } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { DoctorCalendar } from "@/components/calendar/DoctorCalendar";
import api from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  const todayDayOfWeek = new Date().getDay();

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["staff-doctors", todayDayOfWeek],
    queryFn: async () => {
      const doctors = await api.doctors.list();
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

  const selectedDoctor = useMemo(
    () => doctors.find((doctor: any) => doctor.id === selectedDoctorId) ?? null,
    [doctors, selectedDoctorId],
  );

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-8">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold">Doktorlar</h1>
          <p className="mt-1 text-muted-foreground">
            Doktor takvimlerini, musaitlik slotlarini ve istisnalari buradan yonetin.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <motion.div custom={1} variants={fadeUp} className={cn(selectedDoctorId ? "hidden lg:block" : "block")}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Doktor Listesi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-24 animate-pulse rounded-xl bg-muted/40" />
                    ))}
                  </div>
                ) : !doctors.length ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">Doktor bulunmuyor</p>
                ) : (
                  <div className="space-y-3">
                    {doctors.map((doctor: any) => (
                      <button
                        key={doctor.id}
                        type="button"
                        onClick={() => setSelectedDoctorId(doctor.id)}
                        className={cn(
                          "w-full rounded-xl border p-4 text-left transition-colors",
                          selectedDoctorId === doctor.id
                            ? "border-primary bg-primary/5"
                            : "border-border bg-muted/40 hover:bg-muted/60",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{getDoctorDisplayName(doctor)}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {doctor.specialization?.name ?? "Brans belirtilmedi"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Bugünkü slot sayısı: {doctor.todaySlotCount}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-full border",
                              doctor.isAvailableToday
                                ? "bg-success/15 text-success border-success/30"
                                : "bg-muted text-muted-foreground border-border",
                            )}
                          >
                            {doctor.isAvailableToday ? "Müsait" : "Müsait Değil"}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div custom={2} variants={fadeUp} className={cn(!selectedDoctorId ? "hidden lg:block" : "block")}>
            {!selectedDoctor ? (
              <Card className="shadow-card">
                <CardContent className="flex min-h-[480px] flex-col items-center justify-center text-center">
                  <CalendarDays className="mb-4 h-10 w-10 text-primary" />
                  <h2 className="text-xl font-display font-semibold">Takvim gorunumu</h2>
                  <p className="mt-2 max-w-md text-sm text-muted-foreground">
                    Sagdaki takvimi acmak icin listeden bir doktor secin.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-display font-semibold">{getDoctorDisplayName(selectedDoctor)}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedDoctor.specialization?.name ?? "Brans belirtilmedi"}
                    </p>
                  </div>
                  <Button variant="outline" className="rounded-xl lg:hidden min-h-[44px]" onClick={() => setSelectedDoctorId(null)}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Listeye Dön
                  </Button>
                </div>
                <DoctorCalendar doctorId={selectedDoctor.id} mode="staff" />
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
