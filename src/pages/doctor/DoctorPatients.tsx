import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/services/api";

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

function getPatientName(patient: PatientRecord) {
  return (
    patient.full_name
    ?? patient.fullName
    ?? [patient.first_name ?? patient.firstName, patient.last_name ?? patient.lastName]
      .filter(Boolean)
      .join(" ")
      .trim()
  ) || "İsimsiz Hasta";
}

function getInitials(fullName: string) {
  const parts = fullName.split(" ").filter(Boolean).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "H";
}

export default function DoctorPatients() {
  const navigate = useNavigate();
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
      const name = getPatientName(patient).toLowerCase();
      const email = patient.email?.toLowerCase() ?? "";
      return name.includes(query) || email.includes(query);
    });
  }, [patients, search]);

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold">Hastalarım</h1>
          <p className="mt-1 text-muted-foreground">
            Kayıtlı hastaları görüntüleyin ve hasta detaylarına geçin.
          </p>
        </motion.div>

        <motion.div custom={1} variants={fadeUp} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ad veya e-posta ile ara"
            className="pl-10"
          />
        </motion.div>

        <motion.div custom={2} variants={fadeUp}>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="rounded-2xl">
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredPatients.map((patient, index) => {
                const fullName = getPatientName(patient);

                return (
                  <motion.div key={patient.id} custom={index} variants={fadeUp}>
                    <Card className="h-full rounded-2xl border-border/60 shadow-card">
                      <CardContent className="flex h-full flex-col gap-4 p-5">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border border-border/60">
                            <AvatarFallback className="bg-accent text-accent-foreground">
                              {getInitials(fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-display font-semibold">{fullName}</p>
                            <p className="truncate text-sm text-muted-foreground">
                              {patient.email || "E-posta bilgisi yok"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>{patient.email || "E-posta bilgisi yok"}</p>
                          <p>{patient.phone || "Telefon bilgisi yok"}</p>
                        </div>

                        <Button
                          className="mt-auto rounded-xl"
                          onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                        >
                          Görüntüle
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="flex min-h-[260px] flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="rounded-full bg-muted p-4">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Hasta bulunamadı</p>
                  <p className="text-sm text-muted-foreground">
                    Arama kriterlerini değiştirerek tekrar deneyin.
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
