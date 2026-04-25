import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, CalendarDays, Loader2, Plus, Shield, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/services/api";

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
  const canManageClinic = isOwner || user?.role === "admin";

  const [showAddSpec, setShowAddSpec] = useState(false);
  const [specName, setSpecName] = useState("");
  const [specDesc, setSpecDesc] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [clinicEmail, setClinicEmail] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [defaultAppointmentDuration, setDefaultAppointmentDuration] = useState("30");
  const [appointmentApprovalMode, setAppointmentApprovalMode] = useState("manual");
  const [maxBookingDaysAhead, setMaxBookingDaysAhead] = useState("60");
  const [cancellationHoursBefore, setCancellationHoursBefore] = useState("24");
  const [activeSection, setActiveSection] = useState<"clinic" | "appointments" | "owner">("clinic");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const clinicLogoInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingSpecIds, setUploadingSpecIds] = useState<Record<string, boolean>>({});

  const { data: clinic, isLoading: isClinicLoading } = useQuery({
    queryKey: ["clinic", "current"],
    queryFn: async () => api.clinics.current(),
    enabled: Boolean(canManageClinic),
  });

  const { data: specializations } = useQuery({
    queryKey: ["specializations"],
    queryFn: async () => api.specializations.list(),
    enabled: canManageClinic,
  });

  useEffect(() => {
    setClinicName(clinic?.name ?? "");
    setClinicPhone(clinic?.phone ?? "");
    setClinicEmail(clinic?.email ?? "");
    setClinicAddress(clinic?.address ?? "");
    setDefaultAppointmentDuration(String(clinic?.default_appointment_duration ?? 30));
    setAppointmentApprovalMode(clinic?.appointment_approval_mode ?? "manual");
    setMaxBookingDaysAhead(String(clinic?.max_booking_days_ahead ?? 60));
    setCancellationHoursBefore(String(clinic?.cancellation_hours_before ?? 24));
  }, [clinic]);

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

  const saveClinicProfile = useMutation({
    mutationFn: async () => {
      if (!clinic?.id) throw new Error("Clinic not loaded");
      return api.clinics.update(clinic.id, {
        name: clinicName.trim(),
        phone: clinicPhone.trim() || undefined,
        email: clinicEmail.trim() || undefined,
        address: clinicAddress.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["clinic", "current"] });
      toast.success(t.settingsSaved);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Klinik bilgileri kaydedilemedi");
    },
  });

  const saveAppointmentSettings = useMutation({
    mutationFn: async () => {
      if (!clinic?.id) throw new Error("Clinic not loaded");
      return api.clinics.update(clinic.id, {
        default_appointment_duration: Number(defaultAppointmentDuration),
        appointment_approval_mode: appointmentApprovalMode,
        max_booking_days_ahead: Number(maxBookingDaysAhead),
        cancellation_hours_before: Number(cancellationHoursBefore),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["clinic", "current"] });
      toast.success(t.settingsSaved);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Randevu ayarlari kaydedilemedi");
    },
  });

  const handleSpecImageUpload = async (specId: string, file?: File) => {
    if (!file) return;

    setUploadingSpecIds((current) => ({ ...current, [specId]: true }));

    try {
      await api.specializations.uploadImage(specId, file);
      await qc.invalidateQueries({ queryKey: ["specializations"] });
      toast.success("Uzmanlik gorseli yuklendi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gorsel yuklenemedi");
    } finally {
      setUploadingSpecIds((current) => ({ ...current, [specId]: false }));
    }
  };

  const handleClinicLogoUpload = async (file?: File) => {
    if (!file || !user?.clinic_id) return;

    try {
      await api.clinics.uploadLogo(user.clinic_id, file);
      await qc.invalidateQueries({ queryKey: ["clinic", user.clinic_id] });
      await qc.invalidateQueries({ queryKey: ["clinic-branding", user.clinic_id] });
      toast.success("Klinik logosu guncellendi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Klinik logosu yuklenemedi");
    }
  };

  const navItems = [
    ...(canManageClinic ? [{ id: "clinic", label: "Klinik Profili", icon: Building2 }] : []),
    ...(canManageClinic ? [{ id: "appointments", label: "Randevu Ayarlari", icon: CalendarDays }] : []),
    ...(canManageClinic ? [{ id: "owner", label: "Owner Kontrolleri", icon: Shield }] : []),
  ];

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold text-foreground">{t.clinicSettings}</h1>
          <p className="mt-1 text-muted-foreground">{t.clinicSettingsDesc}</p>
        </motion.div>

        <motion.div custom={1} variants={fadeUp}>
          <div className="flex items-start gap-8">
            <div className="sticky top-6 w-56 shrink-0">
              <nav className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-2 shadow-sm">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as "clinic" | "appointments" | "owner")}
                    className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors ${
                      activeSection === item.id ? "bg-primary/10 font-semibold text-primary" : "text-foreground hover:bg-muted/60"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="min-w-0 flex-1">
              {activeSection === "clinic" && canManageClinic && (
                <Card className="rounded-2xl border-border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                      <Building2 className="h-5 w-5 text-primary" />
                      Klinik Profili
                    </CardTitle>
                    <CardDescription>Klinik adi, iletisim bilgileri, adres ve logo burada yonetilir.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                      <div className="space-y-3">
                        <input
                          ref={clinicLogoInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            void handleClinicLogoUpload(file);
                            event.target.value = "";
                          }}
                        />
                        <button
                          type="button"
                          className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[20px] border border-dashed border-border bg-muted/50 transition-colors"
                          onClick={() => isOwner && clinicLogoInputRef.current?.click()}
                        >
                          {clinic?.logo_url ? (
                            <img
                              src={`${clinic.logo_url}?t=${new Date(clinic.updated_at).getTime()}`}
                              alt={clinic.name ?? "Klinik logosu"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 px-3 text-center text-xs text-muted-foreground">
                              <Upload className="h-5 w-5" />
                              Logo yok
                            </div>
                          )}
                        </button>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>JPEG, PNG veya WebP</p>
                          <p>{isOwner ? "Logoyu degistirmek icin tiklayin" : "Logo yukleme sadece owner rolunde acik"}</p>
                        </div>
                      </div>

                      <div className="grid flex-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="clinic-name">Klinik Adi</Label>
                          <Input
                            id="clinic-name"
                            value={clinicName}
                            onChange={(event) => setClinicName(event.target.value)}
                            placeholder="Klinik adi"
                            className="rounded-xl"
                            disabled={isClinicLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clinic-phone">{t.phone}</Label>
                          <Input
                            id="clinic-phone"
                            value={clinicPhone}
                            onChange={(event) => setClinicPhone(event.target.value)}
                            placeholder={t.phone}
                            className="rounded-xl"
                            disabled={isClinicLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clinic-email">{t.email}</Label>
                          <Input
                            id="clinic-email"
                            value={clinicEmail}
                            onChange={(event) => setClinicEmail(event.target.value)}
                            placeholder={t.email}
                            className="rounded-xl"
                            disabled={isClinicLoading}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="clinic-address">{t.address}</Label>
                          <Textarea
                            id="clinic-address"
                            value={clinicAddress}
                            onChange={(event) => setClinicAddress(event.target.value)}
                            placeholder={t.address}
                            className="min-h-[110px] rounded-xl"
                            disabled={isClinicLoading}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => saveClinicProfile.mutate()}
                        disabled={!clinicName.trim() || saveClinicProfile.isPending || isClinicLoading}
                        className="rounded-xl"
                      >
                        {saveClinicProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t.saveSettings}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSection === "appointments" && canManageClinic && (
                <Card className="rounded-2xl border-border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                      <CalendarDays className="h-5 w-5 text-primary" />
                      Randevu Ayarlari
                    </CardTitle>
                    <CardDescription>Randevu sureleri, onay akisi, ileri tarih siniri ve iptal deadline burada yonetilir.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="default-appointment-duration">Varsayilan randevu suresi</Label>
                        <Select value={defaultAppointmentDuration} onValueChange={setDefaultAppointmentDuration}>
                          <SelectTrigger id="default-appointment-duration" className="rounded-xl">
                            <SelectValue placeholder="Sure secin" />
                          </SelectTrigger>
                          <SelectContent>
                            {["15", "20", "30", "45", "60", "90"].map((option) => (
                              <SelectItem key={option} value={option}>
                                {option} dk
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="appointment-approval-mode">Onay modu</Label>
                        <Select value={appointmentApprovalMode} onValueChange={setAppointmentApprovalMode}>
                          <SelectTrigger id="appointment-approval-mode" className="rounded-xl">
                            <SelectValue placeholder="Onay modunu secin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Otomatik Onayla</SelectItem>
                            <SelectItem value="manual">Manuel Onay</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="max-booking-days-ahead">Max rezervasyon gunu</Label>
                        <Input
                          id="max-booking-days-ahead"
                          type="number"
                          min={1}
                          max={365}
                          value={maxBookingDaysAhead}
                          onChange={(event) => setMaxBookingDaysAhead(event.target.value)}
                          className="rounded-xl"
                          disabled={isClinicLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cancellation-hours-before">Iptal deadline (saat)</Label>
                        <Input
                          id="cancellation-hours-before"
                          type="number"
                          min={0}
                          max={168}
                          value={cancellationHoursBefore}
                          onChange={(event) => setCancellationHoursBefore(event.target.value)}
                          className="rounded-xl"
                          disabled={isClinicLoading}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => saveAppointmentSettings.mutate()}
                        disabled={
                          saveAppointmentSettings.isPending ||
                          isClinicLoading ||
                          !defaultAppointmentDuration ||
                          !appointmentApprovalMode ||
                          !maxBookingDaysAhead ||
                          !cancellationHoursBefore
                        }
                        className="rounded-xl"
                      >
                        {saveAppointmentSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {t.saveSettings}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSection === "owner" && canManageClinic && (
                <Card className="rounded-2xl border-border bg-card shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                        <Shield className="h-5 w-5 text-primary" />
                        {t.ownerControls}
                      </CardTitle>
                      <CardDescription>{t.ownerControlsDesc}</CardDescription>
                    </div>
                    <Badge variant="outline" className="rounded-md border-primary/20 bg-primary/10 text-primary">
                      {t.ownerOnly}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-foreground">{t.specializations}</h3>
                        <p className="text-sm text-muted-foreground">{t.specManageDesc}</p>
                      </div>
                      <Button onClick={() => setShowAddSpec(true)} className="rounded-xl">
                        <Plus className="h-4 w-4" /> {t.add}
                      </Button>
                    </div>

                    {!specializations?.length ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">-</p>
                    ) : (
                      <div className="space-y-2">
                        {specializations.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 p-3 transition-colors hover:bg-muted/70"
                          >
                            <div className="flex items-center gap-3">
                              {s.imageUrl ? (
                                <img
                                  src={s.imageUrl}
                                  alt={s.name}
                                  style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: "12px",
                                    objectFit: "cover",
                                    objectPosition: "center",
                                    border: "2px solid hsl(var(--border))",
                                  }}
                                />
                              ) : (
                                <div
                                  className="flex h-[52px] w-[52px] items-center justify-center rounded-lg text-center text-[11px] text-muted-foreground"
                                  style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--muted)))" }}
                                >
                                  Gorsel yok
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-foreground">{s.name}</p>
                                {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                ref={(element) => {
                                  fileInputRefs.current[s.id] = element;
                                }}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  void handleSpecImageUpload(s.id, file);
                                  event.target.value = "";
                                }}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRefs.current[s.id]?.click()}
                                disabled={!!uploadingSpecIds[s.id]}
                                className="rounded-md"
                              >
                                {uploadingSpecIds[s.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Gorsel Yukle
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => deleteSpec.mutate(s.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
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
            <Button variant="outline" onClick={() => setShowAddSpec(false)} className="rounded-xl">
              {t.cancel}
            </Button>
            <Button onClick={() => addSpec.mutate()} disabled={!specName.trim() || addSpec.isPending} className="rounded-xl">
              {t.addSpecialization}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
