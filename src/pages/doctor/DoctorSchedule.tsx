import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Clock, Plus, Trash2, Loader2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const timeOptions: string[] = [];
for (let h = 6; h <= 22; h++) { for (let m = 0; m < 60; m += 30) { timeOptions.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`); } }

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }),
};

export default function DoctorSchedule() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newDay, setNewDay] = useState("1");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("17:00");

  const dayNames = [t.sunday, t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday];
  const dayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const { data: doctorRecord } = useQuery({ queryKey: ["my-doctor-record", user?.id], queryFn: async () => { const { data, error } = await supabase.from("doctors").select("id").eq("user_id", user!.id).single(); if (error) throw error; return data; }, enabled: !!user });
  const { data: availability, isLoading } = useQuery({ queryKey: ["my-availability", doctorRecord?.id], queryFn: async () => { const { data, error } = await supabase.from("doctor_availability").select("*").eq("doctor_id", doctorRecord!.id).order("day_of_week").order("start_time"); if (error) throw error; return data; }, enabled: !!doctorRecord });

  const addSlot = useMutation({ mutationFn: async () => { if (!doctorRecord) throw new Error("No doctor record"); const { error } = await supabase.from("doctor_availability").insert({ doctor_id: doctorRecord.id, day_of_week: parseInt(newDay), start_time: newStart + ":00", end_time: newEnd + ":00", is_active: true }); if (error) throw error; }, onSuccess: () => { toast.success(t.slotAdded); queryClient.invalidateQueries({ queryKey: ["my-availability"] }); setAddDialogOpen(false); }, onError: (err: any) => toast.error(err.message) });
  const toggleSlot = useMutation({ mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => { const { error } = await supabase.from("doctor_availability").update({ is_active }).eq("id", id); if (error) throw error; }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-availability"] }), onError: (err: any) => toast.error(err.message) });
  const deleteSlot = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("doctor_availability").delete().eq("id", id); if (error) throw error; }, onSuccess: () => { toast.success(t.slotRemoved); queryClient.invalidateQueries({ queryKey: ["my-availability"] }); }, onError: (err: any) => toast.error(err.message) });

  const groupedByDay = dayNames.map((name, idx) => ({ name, short: dayShort[idx], idx, slots: availability?.filter((a) => a.day_of_week === idx) || [] }));

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible">
        <motion.div className="flex items-center justify-between mb-8" custom={0} variants={fadeUp}>
          <div><h1 className="text-3xl font-display font-bold mb-2">{t.mySchedule}</h1><p className="text-muted-foreground">{t.myScheduleDesc}</p></div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild><Button className="rounded-xl shadow-soft"><Plus className="h-4 w-4 mr-2" /> {t.addSlot}</Button></DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader><DialogTitle className="font-display">{t.addAvailabilitySlot}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2"><Label>{t.dayOfWeek}</Label><Select value={newDay} onValueChange={setNewDay}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{dayNames.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent></Select></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>{t.startTime}</Label><Select value={newStart} onValueChange={setNewStart}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{timeOptions.map((tt) => <SelectItem key={tt} value={tt}>{tt}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><Label>{t.endTime}</Label><Select value={newEnd} onValueChange={setNewEnd}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{timeOptions.map((tt) => <SelectItem key={tt} value={tt}>{tt}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <Button className="w-full rounded-xl" onClick={() => addSlot.mutate()} disabled={addSlot.isPending}>
                  {addSlot.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t.adding}</> : <><Save className="mr-2 h-4 w-4" /> {t.saveSlot}</>}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {isLoading ? <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="glass rounded-2xl p-5 shadow-card animate-pulse h-20" />)}</div> : (
          <div className="space-y-3">
            {groupedByDay.map((day, i) => (
              <motion.div key={day.idx} className="glass rounded-2xl p-5 shadow-card" custom={i + 1} variants={fadeUp}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm", day.slots.length > 0 ? "bg-gradient-to-br from-primary to-info text-primary-foreground" : "bg-muted text-muted-foreground")}>{day.short}</div>
                    <div><div className="font-display font-semibold text-sm">{day.name}</div><div className="text-xs text-muted-foreground">{day.slots.length > 0 ? `${day.slots.filter((s) => s.is_active).length} ${t.activeSlots}` : t.noAvailability}</div></div>
                  </div>
                </div>
                {day.slots.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {day.slots.map((slot) => (
                      <div key={slot.id} className={cn("flex items-center justify-between p-3 rounded-xl text-sm", slot.is_active ? "bg-muted/50" : "bg-muted/30 opacity-60")}>
                        <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{slot.start_time.slice(0, 5)} — {slot.end_time.slice(0, 5)}</span></div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2"><Switch checked={slot.is_active ?? false} onCheckedChange={(checked) => toggleSlot.mutate({ id: slot.id, is_active: checked })} /><span className="text-xs text-muted-foreground w-12">{slot.is_active ? t.active : t.off}</span></div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteSlot.mutate(slot.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
