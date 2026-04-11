import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { DoctorCalendar } from "@/components/calendar/DoctorCalendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/services/api";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function DoctorSchedule() {
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    console.debug("[doctor][schedule] mounted", {
      userId: user?.id,
      role: user?.role,
    });
  }, [user?.id, user?.role]);

  const {
    data: doctorRecord,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["my-doctor-record", user?.id],
    queryFn: async () => api.doctors.me(),
    enabled: !!user,
  });

  const { data: clinic } = useQuery({
    queryKey: ["clinic", user?.clinic_id],
    queryFn: async () => api.clinics.get(user!.clinic_id!),
    enabled: Boolean(user?.clinic_id),
  });

  useEffect(() => {
    console.debug("[doctor][schedule] query state", {
      userId: user?.id,
      role: user?.role,
      hasDoctorRecord: Boolean(doctorRecord),
      doctorRecordId: doctorRecord?.id,
      isLoading,
      isError,
      error: error instanceof Error ? error.message : error,
    });
  }, [doctorRecord, error, isError, isLoading, user?.id, user?.role]);

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible">
        <motion.div
          className="mb-5 rounded-[28px] border border-border/60 bg-card/80 px-4 py-4 shadow-soft"
          custom={0}
          variants={fadeUp}
        >
          <h1 className="mb-1 text-[1.9rem] font-display font-bold tracking-[-0.03em]">
            {t.mySchedule}
          </h1>
          <p className="text-muted-foreground">{t.myScheduleDesc}</p>
        </motion.div>

        {doctorRecord ? (
          <DoctorCalendar
            doctorId={doctorRecord.id}
            mode="doctor"
            defaultDuration={clinic?.default_appointment_duration ?? 30}
          />
        ) : isError ? (
          <Alert className="rounded-2xl">
            <AlertTitle>Doctor schedule could not be loaded</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Unknown error"}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
