import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Search, Users, Mail, Phone } from "lucide-react";
import { format } from "date-fns";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function ManagePatients() {
  const [search, setSearch] = useState("");

  const { data: patients } = useQuery({
    queryKey: ["admin-patients"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = patients?.filter((p) => {
    const q = search.toLowerCase();
    return (p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q));
  }) ?? [];

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold">Manage Patients</h1>
          <p className="text-muted-foreground mt-1">{patients?.length ?? 0} registered patients</p>
        </motion.div>

        <motion.div custom={1} variants={fadeUp} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </motion.div>

        <motion.div custom={2} variants={fadeUp}>
          <Card className="shadow-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-4 text-sm font-medium text-muted-foreground">Patient</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Email</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Phone</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-secondary to-success flex items-center justify-center text-primary-foreground font-bold text-sm">
                              {p.full_name?.[0] ?? "P"}
                            </div>
                            <p className="font-medium text-sm">{p.full_name ?? "Unknown"}</p>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell text-sm text-muted-foreground">{p.email ?? "—"}</td>
                        <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">{p.phone ?? "—"}</td>
                        <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">
                          {format(new Date(p.created_at), "MMM d, yyyy")}
                        </td>
                      </tr>
                    ))}
                    {!filtered.length && (
                      <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No patients found.</td></tr>
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
