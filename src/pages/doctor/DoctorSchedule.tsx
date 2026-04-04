import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { DoctorCalendar } from "@/components/calendar/DoctorCalendar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMyDoctorProfile } from "@/hooks/useMyDoctorProfile";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function DoctorSchedule() {
  const { t } = useLanguage();

  const { data: doctorRecord } = useMyDoctorProfile();

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible">
        <motion.div className="mb-8" custom={0} variants={fadeUp}>
          <div className="calendar-suite-kicker">Hekim Takvimi</div>
          <h1 className="mt-4 text-3xl font-display font-bold text-slate-950">{t.mySchedule}</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">{t.myScheduleDesc}</p>
        </motion.div>

        {doctorRecord ? (
          <div className="calendar-suite-shell p-4 xl:p-5">
            <DoctorCalendar
              doctorId={doctorRecord.id}
              variant="doctor"
              doctorName={`${doctorRecord.firstName ?? ""} ${doctorRecord.lastName ?? ""}`.trim() || doctorRecord.email}
              doctorSubtitle={doctorRecord.specialization?.name ?? "Kendi takviminiz"}
            />
          </div>
        ) : (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
