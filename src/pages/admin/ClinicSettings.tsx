import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarClock, Palette, Plus, Settings, Shield, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/services/api";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function ClinicSettings() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isOwner = user?.role === "owner";
  const [showAddSpec, setShowAddSpec] = useState(false);
  const [specName, setSpecName] = useState("");
  const [specDesc, setSpecDesc] = useState("");
  const [clinicInfo, setClinicInfo] = useState({
    clinicName: "MediBook Clinic",
    clinicPhone: "+1 (555) 000-0000",
    clinicAddress: "123 Health Avenue, Suite 200",
    clinicEmail: "admin@medibook.com",
  });
  const [appointmentSettings, setAppointmentSettings] = useState({
    defaultDuration: "30",
    bufferTime: "10",
    allowSameDayBooking: true,
    allowSelfBooking: true,
  });
  const [staffAccess, setStaffAccess] = useState({
    approverRole: "Admin",
    canManagePatients: true,
    canManageDoctors: false,
  });
  const [branding, setBranding] = useState({
    clinicLogo: "medibook-mark.svg",
    defaultLanguage: "English",
    primaryColor: "Ocean Blue",
  });

  const { data: specializations } = useQuery({
    queryKey: ["specializations"],
    queryFn: async () => api.specializations.list(),
  });

  const addSpec = useMutation({
    mutationFn: async () => api.specializations.create({ name: specName, description: specDesc || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["specializations"] });
      setShowAddSpec(false);
      setSpecName("");
      setSpecDesc("");
      toast.success(t.specAdded);
    },
    onError: () => toast.error(t.specAddFailed),
  });

  const deleteSpec = useMutation({
    mutationFn: async (id: string) => api.specializations.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["specializations"] });
      toast.success(t.specDeleted);
    },
    onError: () => toast.error(t.specDeleteFailed),
  });

  const saveOperationalSettings = () => {
    toast.success(t.settingsSaved);
  };

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold">{t.clinicSettings}</h1>
          <p className="text-muted-foreground mt-1">{t.clinicSettingsDesc}</p>
        </motion.div>

        <motion.div custom={1} variants={fadeUp}>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-primary" />
                {t.clinicInfo}
              </CardTitle>
              <CardDescription>{t.clinicInfoDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>{t.clinicName}</Label>
                  <Input value={clinicInfo.clinicName} onChange={(e) => setClinicInfo({ ...clinicInfo, clinicName: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>{t.contactPhone}</Label>
                  <Input value={clinicInfo.clinicPhone} onChange={(e) => setClinicInfo({ ...clinicInfo, clinicPhone: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>{t.clinicAddress}</Label>
                  <Input value={clinicInfo.clinicAddress} onChange={(e) => setClinicInfo({ ...clinicInfo, clinicAddress: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>{t.contactEmail}</Label>
                  <Input value={clinicInfo.clinicEmail} onChange={(e) => setClinicInfo({ ...clinicInfo, clinicEmail: e.target.value })} className="mt-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={2} variants={fadeUp}>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarClock className="h-5 w-5 text-primary" />
                {t.appointmentSettings}
              </CardTitle>
              <CardDescription>{t.appointmentSettingsDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>{t.defaultSlotDuration}</Label>
                  <Input type="number" value={appointmentSettings.defaultDuration} onChange={(e) => setAppointmentSettings({ ...appointmentSettings, defaultDuration: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>{t.bufferTime}</Label>
                  <Input type="number" value={appointmentSettings.bufferTime} onChange={(e) => setAppointmentSettings({ ...appointmentSettings, bufferTime: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="font-medium text-sm">{t.allowSameDayBooking}</p>
                    <p className="text-xs text-muted-foreground">{t.allowSameDayBookingDesc}</p>
                  </div>
                  <Switch checked={appointmentSettings.allowSameDayBooking} onCheckedChange={(checked) => setAppointmentSettings({ ...appointmentSettings, allowSameDayBooking: checked })} />
                </div>
                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="font-medium text-sm">{t.allowSelfBooking}</p>
                    <p className="text-xs text-muted-foreground">{t.allowSelfBookingDesc}</p>
                  </div>
                  <Switch checked={appointmentSettings.allowSelfBooking} onCheckedChange={(checked) => setAppointmentSettings({ ...appointmentSettings, allowSelfBooking: checked })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={3} variants={fadeUp}>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                {t.staffAccess}
              </CardTitle>
              <CardDescription>{t.staffAccessDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>{t.approvalRole}</Label>
                  <Input value={staffAccess.approverRole} onChange={(e) => setStaffAccess({ ...staffAccess, approverRole: e.target.value })} className="mt-1" />
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="font-medium text-sm">{t.staffManagePatients}</p>
                    <p className="text-xs text-muted-foreground">{t.staffManagePatientsDesc}</p>
                  </div>
                  <Switch checked={staffAccess.canManagePatients} onCheckedChange={(checked) => setStaffAccess({ ...staffAccess, canManagePatients: checked })} />
                </div>
                <div className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="font-medium text-sm">{t.staffManageDoctors}</p>
                    <p className="text-xs text-muted-foreground">{t.staffManageDoctorsDesc}</p>
                  </div>
                  <Switch checked={staffAccess.canManageDoctors} onCheckedChange={(checked) => setStaffAccess({ ...staffAccess, canManageDoctors: checked })} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={4} variants={fadeUp}>
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5 text-primary" />
                {t.branding}
              </CardTitle>
              <CardDescription>{t.brandingDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>{t.clinicLogo}</Label>
                  <Input value={branding.clinicLogo} onChange={(e) => setBranding({ ...branding, clinicLogo: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>{t.defaultLanguage}</Label>
                  <Input value={branding.defaultLanguage} onChange={(e) => setBranding({ ...branding, defaultLanguage: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label>{t.primaryColor}</Label>
                  <Input value={branding.primaryColor} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })} className="mt-1" />
                </div>
              </div>
              <Button className="mt-6" onClick={saveOperationalSettings}>{t.saveSettings}</Button>
            </CardContent>
          </Card>
        </motion.div>

        {isOwner && (
          <motion.div custom={5} variants={fadeUp}>
            <Card className="shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    {t.ownerControls}
                  </CardTitle>
                  <CardDescription>{t.ownerControlsDesc}</CardDescription>
                </div>
                <Badge variant="outline">{t.ownerOnly}</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium">{t.specializations}</h3>
                    <p className="text-sm text-muted-foreground">{t.specManageDesc}</p>
                  </div>
                  <Button size="sm" onClick={() => setShowAddSpec(true)}>
                    <Plus className="h-4 w-4 mr-1" /> {t.add}
                  </Button>
                </div>
                {!specializations?.length ? (
                  <p className="text-muted-foreground text-sm text-center py-4">—</p>
                ) : (
                  <div className="space-y-2">
                    {specializations.map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteSpec.mutate(s.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>

      <Dialog open={showAddSpec} onOpenChange={setShowAddSpec}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.addSpecialization}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t.name} *</Label>
              <Input value={specName} onChange={(e) => setSpecName(e.target.value)} />
            </div>
            <div>
              <Label>{t.description}</Label>
              <Input value={specDesc} onChange={(e) => setSpecDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSpec(false)}>{t.cancel}</Button>
            <Button onClick={() => addSpec.mutate()} disabled={!specName.trim() || addSpec.isPending}>{t.addSpecialization}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
