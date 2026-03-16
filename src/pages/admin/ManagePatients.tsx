import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { format } from "date-fns";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }) };

export default function ManagePatients() {
  const [search, setSearch] = useState("");
  const { t } = useLanguage();

  const { data: patientsResult } = useQuery({
    queryKey: ["admin-patients"],
    queryFn: async () => api.patients.list(),
  });
  const patients = Array.isArray(patientsResult) ? patientsResult : (patientsResult?.data ?? []);
  const totalPatients = Array.isArray(patientsResult) ? patientsResult.length : (patientsResult?.total ?? patients.length);
  const filtered = patients?.filter((p) => {
    const q = search.toLowerCase();
    const firstName = p.first_name?.toLowerCase() ?? "";
    const lastName = p.last_name?.toLowerCase() ?? "";
    const fullName = `${firstName} ${lastName}`.trim();
    const email = p.email?.toLowerCase() ?? "";
    return fullName.includes(q) || firstName.includes(q) || lastName.includes(q) || email.includes(q);
  }) ?? [];

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}><h1 className="text-3xl font-display font-bold">{t.managePatients}</h1><p className="text-muted-foreground mt-1">{totalPatients} {t.registeredPatients}</p></motion.div>
        <motion.div custom={1} variants={fadeUp} className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t.searchByNameOrEmail} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></motion.div>
        <motion.div custom={2} variants={fadeUp}>
          <Card className="shadow-card"><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b text-left"><th className="p-4 text-sm font-medium text-muted-foreground">{t.patient}</th><th className="p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">{t.email}</th><th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">{t.phone}</th><th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">{t.joined}</th></tr></thead>
          <tbody>{filtered.map((p) => { const fullName = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Unknown"; return (<tr key={p.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors"><td className="p-4"><div className="flex items-center gap-3"><div className="h-9 w-9 rounded-full bg-gradient-to-br from-secondary to-success flex items-center justify-center text-primary-foreground font-bold text-sm">{fullName[0] ?? "P"}</div><p className="font-medium text-sm">{fullName}</p></div></td><td className="p-4 hidden md:table-cell text-sm text-muted-foreground">{p.email ?? "—"}</td><td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">{p.phone ?? "—"}</td><td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">{format(new Date(p.created_at), "MMM d, yyyy")}</td></tr>); })}{!filtered.length && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">—</td></tr>}</tbody></table></div></CardContent></Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
