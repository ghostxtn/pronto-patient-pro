import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { DoctorCalendar } from "@/components/calendar/DoctorCalendar";
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

  const { data: doctorRecord } = useQuery({
    queryKey: ["my-doctor-record", user?.id],
    queryFn: async () => {
      const doctors = await api.doctors.list();
      const doctor = doctors.find((item: any) => item.user_id === user!.id);
      if (!doctor) {
        throw new Error("Doctor record not found");
      }
      return doctor;
    },
    enabled: !!user,
  });

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible">
        <motion.div className="mb-8" custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold mb-2">{t.mySchedule}</h1>
          <p className="text-muted-foreground">{t.myScheduleDesc}</p>
        </motion.div>

        {doctorRecord ? (
          <DoctorCalendar doctorId={doctorRecord.id} />
        ) : (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
