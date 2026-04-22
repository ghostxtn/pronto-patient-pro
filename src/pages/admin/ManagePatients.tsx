import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatLocalizedDateFns } from "@/lib/date-localization";
import api from "@/services/api";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function ManagePatients() {
  const [search, setSearch] = useState("");
  const { lang, t } = useLanguage();

  const { data: patientsResult } = useQuery({
    queryKey: ["admin-patients"],
    queryFn: async () => api.patients.list(),
  });

  const patients = Array.isArray(patientsResult) ? patientsResult : (patientsResult?.data ?? []);
  const totalPatients = Array.isArray(patientsResult)
    ? patientsResult.length
    : (patientsResult?.total ?? patients.length);

  const filtered = patients.filter((patient) => {
    const query = search.toLowerCase();
    const firstName = patient.first_name?.toLowerCase() ?? "";
    const lastName = patient.last_name?.toLowerCase() ?? "";
    const fullName = `${firstName} ${lastName}`.trim();
    const email = patient.email?.toLowerCase() ?? "";
    return fullName.includes(query) || firstName.includes(query) || lastName.includes(query) || email.includes(query);
  });

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>
            {t.managePatients}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {totalPatients} {t.registeredPatients}
          </p>
        </motion.div>

        <motion.div custom={1} variants={fadeUp} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.searchByNameOrEmail}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </motion.div>

        <motion.div custom={2} variants={fadeUp}>
          <Card className="overflow-visible rounded-2xl border border-border bg-card shadow-sm">
            <CardContent className="p-0">
              <div className="max-h-[560px] overflow-x-auto overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left">
                      <th className="p-4 text-sm font-medium text-muted-foreground">{t.patient}</th>
                      <th className="hidden p-4 text-sm font-medium text-muted-foreground md:table-cell">{t.email}</th>
                      <th className="hidden p-4 text-sm font-medium text-muted-foreground lg:table-cell">{t.phone}</th>
                      <th className="hidden p-4 text-sm font-medium text-muted-foreground lg:table-cell">{t.joined}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((patient) => {
                      const fullName = `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || "Unknown";

                      return (
                        <tr key={patient.id} className="border-b border-border bg-card transition-colors last:border-0 hover:bg-muted/40">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border-2 border-border bg-emerald-500/10 text-[0.875rem] font-bold text-emerald-700 dark:text-emerald-200">
                                {fullName[0] ?? "P"}
                              </div>
                              <p className="text-sm font-medium text-foreground">{fullName}</p>
                            </div>
                          </td>
                          <td className="hidden p-4 text-sm text-muted-foreground md:table-cell">{patient.email ?? "—"}</td>
                          <td className="hidden p-4 text-sm text-muted-foreground lg:table-cell">{patient.phone ?? "—"}</td>
                          <td className="hidden p-4 text-sm text-muted-foreground lg:table-cell">
                            {formatLocalizedDateFns(new Date(patient.created_at), "MMM d, yyyy", lang)}
                          </td>
                        </tr>
                      );
                    })}

                    {!filtered.length && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                          —
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
