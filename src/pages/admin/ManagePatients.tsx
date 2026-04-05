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
        <motion.div custom={0} variants={fadeUp}><h1 className="text-3xl font-display font-bold" style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>{t.managePatients}</h1><p className="text-muted-foreground mt-1" style={{ color: "#5a7a8a" }}>{totalPatients} {t.registeredPatients}</p></motion.div>
        <motion.div custom={1} variants={fadeUp} className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t.searchByNameOrEmail} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></motion.div>
        <motion.div custom={2} variants={fadeUp}>
          <Card style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", boxShadow: "0 2px 12px rgba(79,143,230,0.08)", overflow: "hidden" }}><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="text-left" style={{ background: "#f4f8fd", borderBottom: "1px solid #b5d1cc" }}><th className="p-4 text-sm font-medium text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.8rem", fontWeight: 600, padding: "12px 16px" }}>{t.patient}</th><th className="p-4 text-sm font-medium text-muted-foreground hidden md:table-cell" style={{ color: "#5a7a8a", fontSize: "0.8rem", fontWeight: 600, padding: "12px 16px" }}>{t.email}</th><th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell" style={{ color: "#5a7a8a", fontSize: "0.8rem", fontWeight: 600, padding: "12px 16px" }}>{t.phone}</th><th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell" style={{ color: "#5a7a8a", fontSize: "0.8rem", fontWeight: 600, padding: "12px 16px" }}>{t.joined}</th></tr></thead>
          <tbody>{filtered.map((p) => { const fullName = `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Unknown"; return (<tr key={p.id} className="last:border-0 transition-colors" style={{ borderBottom: "1px solid #f0f4f8" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f4f8fd"} onMouseLeave={(e) => e.currentTarget.style.background = "white"}><td className="p-4"><div className="flex items-center gap-3"><div style={{ width: 36, height: 36, borderRadius: "10px", background: "#e6f4ef", color: "#65a98f", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, border: "2px solid #b5d1cc", flexShrink: 0 }}>{fullName[0] ?? "P"}</div><p className="font-medium text-sm" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.9rem" }}>{fullName}</p></div></td><td className="p-4 hidden md:table-cell text-sm text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem" }}>{p.email ?? "—"}</td><td className="p-4 hidden lg:table-cell text-sm text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem" }}>{p.phone ?? "—"}</td><td className="p-4 hidden lg:table-cell text-sm text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem" }}>{format(new Date(p.created_at), "MMM d, yyyy")}</td></tr>); })}{!filtered.length && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">—</td></tr>}</tbody></table></div></CardContent></Card>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
