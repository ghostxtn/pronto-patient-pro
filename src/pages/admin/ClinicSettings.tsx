import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Settings, Plus, Trash2, Palette, Stethoscope } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function ClinicSettings() {
  const qc = useQueryClient();
  const [showAddSpec, setShowAddSpec] = useState(false);
  const [specName, setSpecName] = useState("");
  const [specDesc, setSpecDesc] = useState("");
  const [specIcon, setSpecIcon] = useState("");

  const { data: specializations } = useQuery({
    queryKey: ["specializations"],
    queryFn: async () => {
      const { data } = await supabase.from("specializations").select("*").order("name");
      return data ?? [];
    },
  });

  const addSpec = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("specializations").insert({ name: specName, description: specDesc || null, icon: specIcon || null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["specializations"] });
      setShowAddSpec(false);
      setSpecName("");
      setSpecDesc("");
      setSpecIcon("");
      toast.success("Specialization added");
    },
    onError: () => toast.error("Failed to add specialization"),
  });

  const deleteSpec = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("specializations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["specializations"] }); toast.success("Specialization deleted"); },
    onError: () => toast.error("Cannot delete — may be in use by doctors"),
  });

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold">Clinic Settings</h1>
          <p className="text-muted-foreground mt-1">Manage clinic configuration and specializations.</p>
        </motion.div>

        {/* Specializations */}
        <motion.div custom={1} variants={fadeUp}>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Specializations
                </CardTitle>
                <CardDescription>Manage medical specializations available in your clinic.</CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowAddSpec(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {!specializations?.length ? (
                <p className="text-muted-foreground text-sm text-center py-4">No specializations configured.</p>
              ) : (
                <div className="space-y-2">
                  {specializations.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {s.icon && <Badge variant="outline" className="text-xs">{s.icon}</Badge>}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSpec.mutate(s.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Clinic Info placeholder */}
        <motion.div custom={2} variants={fadeUp}>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-primary" />
                General Settings
              </CardTitle>
              <CardDescription>Clinic-wide configuration options.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Clinic Name</Label>
                  <Input defaultValue="MediBook Clinic" className="mt-1" />
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <Input defaultValue="admin@medibook.com" className="mt-1" />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input defaultValue="+1 (555) 000-0000" className="mt-1" />
                </div>
                <div>
                  <Label>Default Slot Duration (min)</Label>
                  <Input type="number" defaultValue={30} className="mt-1" />
                </div>
              </div>
              <Button className="mt-6">Save Settings</Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Dialog open={showAddSpec} onOpenChange={setShowAddSpec}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Specialization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={specName} onChange={(e) => setSpecName(e.target.value)} placeholder="e.g. Cardiology" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={specDesc} onChange={(e) => setSpecDesc(e.target.value)} placeholder="Optional description" />
            </div>
            <div>
              <Label>Icon Key</Label>
              <Input value={specIcon} onChange={(e) => setSpecIcon(e.target.value)} placeholder="e.g. heart-pulse" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSpec(false)}>Cancel</Button>
            <Button onClick={() => addSpec.mutate()} disabled={!specName.trim() || addSpec.isPending}>Add Specialization</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
