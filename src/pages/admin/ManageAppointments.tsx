import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Search, CalendarDays, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  pending: { color: "bg-warning/15 text-warning border-warning/30", icon: Clock },
  confirmed: { color: "bg-primary/15 text-primary border-primary/30", icon: CheckCircle2 },
  completed: { color: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
  cancelled: { color: "bg-destructive/15 text-destructive border-destructive/30", icon: XCircle },
};

export default function ManageAppointments() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");

  const { data: appointments } = useQuery({
    queryKey: ["admin-all-appointments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*, doctors(id, user_id, profiles:user_id(full_name)), profiles!appointments_patient_profile_fkey(full_name)")
        .order("appointment_date", { ascending: false });
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-all-appointments"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      setSelected(null);
      toast.success("Appointment status updated");
    },
  });

  const filtered = appointments?.filter((a: any) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || a.profiles?.full_name?.toLowerCase().includes(q) || a.doctors?.profiles?.full_name?.toLowerCase().includes(q);
    const matchesTab = tab === "all" || a.status === tab;
    return matchesSearch && matchesTab;
  }) ?? [];

  const counts: Record<string, number> = { all: appointments?.length ?? 0 };
  appointments?.forEach((a: any) => { counts[a.status] = (counts[a.status] ?? 0) + 1; });

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold">Manage Appointments</h1>
          <p className="text-muted-foreground mt-1">{appointments?.length ?? 0} total appointments</p>
        </motion.div>

        <motion.div custom={1} variants={fadeUp} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by patient or doctor name…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </motion.div>

        <motion.div custom={2} variants={fadeUp}>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({counts.pending ?? 0})</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed ({counts.confirmed ?? 0})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({counts.completed ?? 0})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({counts.cancelled ?? 0})</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        <motion.div custom={3} variants={fadeUp}>
          <Card className="shadow-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-4 text-sm font-medium text-muted-foreground">Patient</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Doctor</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Date</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Time</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((apt: any) => {
                      const cfg = statusConfig[apt.status] ?? statusConfig.pending;
                      return (
                        <tr key={apt.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                          <td className="p-4 text-sm font-medium">{apt.profiles?.full_name ?? "Patient"}</td>
                          <td className="p-4 text-sm">Dr. {apt.doctors?.profiles?.full_name ?? "Doctor"}</td>
                          <td className="p-4 hidden md:table-cell text-sm text-muted-foreground">
                            {format(new Date(apt.appointment_date), "MMM d, yyyy")}
                          </td>
                          <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">{apt.start_time?.slice(0, 5)}</td>
                          <td className="p-4">
                            <Badge variant="outline" className={cfg.color}>{apt.status}</Badge>
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="sm" onClick={() => { setSelected(apt); setNewStatus(apt.status); }}>
                              Manage
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {!filtered.length && (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No appointments found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Appointment</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Patient:</span> <p className="font-medium">{selected.profiles?.full_name}</p></div>
                <div><span className="text-muted-foreground">Doctor:</span> <p className="font-medium">Dr. {selected.doctors?.profiles?.full_name}</p></div>
                <div><span className="text-muted-foreground">Date:</span> <p className="font-medium">{format(new Date(selected.appointment_date), "MMM d, yyyy")}</p></div>
                <div><span className="text-muted-foreground">Time:</span> <p className="font-medium">{selected.start_time?.slice(0, 5)} – {selected.end_time?.slice(0, 5)}</p></div>
              </div>
              {selected.notes && (
                <div className="text-sm"><span className="text-muted-foreground">Notes:</span><p className="mt-1 p-3 rounded-lg bg-muted/50">{selected.notes}</p></div>
              )}
              <div>
                <span className="text-sm text-muted-foreground">Update Status</span>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
            <Button
              onClick={() => updateStatus.mutate({ id: selected.id, status: newStatus })}
              disabled={updateStatus.isPending || newStatus === selected?.status}
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
