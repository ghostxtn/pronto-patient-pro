import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

interface PatientRecord {
  id: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  full_name?: string;
  fullName?: string;
  email?: string | null;
  phone?: string | null;
}

function getPatientName(patient: PatientRecord, fallback: string) {
  return (
    patient.full_name
    ?? patient.fullName
    ?? [patient.first_name ?? patient.firstName, patient.last_name ?? patient.lastName]
      .filter(Boolean)
      .join(" ")
      .trim()
  ) || fallback;
}

function getInitials(fullName: string) {
  const parts = fullName.split(" ").filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "H";
}

export default function DoctorPatients() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");

  const { data: patientsResult, isLoading } = useQuery({
    queryKey: ["doctor-patients"],
    queryFn: async () => api.patients.list(),
  });

  const patients = useMemo<PatientRecord[]>(
    () => (Array.isArray(patientsResult) ? patientsResult : (patientsResult?.data ?? [])),
    [patientsResult],
  );

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return patients;

    return patients.filter((patient) => {
      const name = getPatientName(patient, t.unnamedPatient).toLowerCase();
      const email = patient.email?.toLowerCase() ?? "";
      return name.includes(query) || email.includes(query);
    });
  }, [patients, search, t.unnamedPatient]);

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6 rounded-[28px] bg-background/40 p-1">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
            {t.myPatients}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
            {t.doctorPatientsDesc}
          </p>
        </motion.div>

        <motion.div custom={1} variants={fadeUp}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#5a7a8a" }} />
            <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.patientSearchByNameEmail}
              className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontFamily: "Inter, sans-serif" }}
            />
          </div>
        </motion.div>

        <motion.div custom={2} variants={fadeUp}>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" style={{ maxHeight: "560px", overflowY: "auto" }}>
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="rounded-2xl border border-border bg-card shadow-sm">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40 rounded-lg" />
                        <Skeleton className="h-3 w-28 rounded-lg" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-48 rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPatients.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" style={{ maxHeight: "560px", overflowY: "auto" }}>
              {filteredPatients.map((patient, index) => {
                const fullName = getPatientName(patient, t.unnamedPatient);

                return (
                  <motion.div key={patient.id} custom={index} variants={fadeUp}>
                    <Card className="h-full rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md">
                      <CardContent className="flex h-full flex-col gap-4 p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
                            <span className="text-sm font-bold text-primary" style={{ fontFamily: "Manrope, sans-serif" }}>
                              {getInitials(fullName)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>{fullName}</p>
                            <p className="truncate text-sm text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                              {patient.email || t.noEmailInfo}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground" style={{ fontFamily: "Inter, sans-serif" }}>
                          <p>{patient.email || t.noEmailInfo}</p>
                          <p>{patient.phone || t.noPhoneInfo}</p>
                        </div>

                        <button
                          className="mt-auto w-full rounded-xl bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                          style={{ fontFamily: "Inter, sans-serif" }}
                          onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                        >
                          {t.view}
                        </button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="rounded-2xl border border-dashed border-border bg-card">
              <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>{t.patientNotFound}</p>
                  <p className="text-sm" style={{ color: "#5a7a8a", fontFamily: "Inter, sans-serif" }}>
                    {t.adjustSearchCriteria}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
