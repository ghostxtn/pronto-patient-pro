import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { DoctorCalendar } from "@/components/calendar/DoctorCalendar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";

export default function DoctorSchedule() {
  const { user } = useAuth();

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
    <AppLayout mainClassName="flex min-h-0 overflow-hidden pt-3 pb-4 sm:pt-4 sm:pb-6">
      <motion.div
        initial="hidden"
        animate="visible"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        {doctorRecord ? (
          <div className="min-h-0 flex-1 overflow-hidden">
            <DoctorCalendar
              doctorId={doctorRecord.id}
              mode="doctor"
              defaultDuration={clinic?.default_appointment_duration ?? 30}
            />
          </div>
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
