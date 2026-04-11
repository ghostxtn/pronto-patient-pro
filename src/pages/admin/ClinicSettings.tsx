import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, Loader2, Plus, Shield, Trash2, Upload } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const clinicLogoInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingSpecIds, setUploadingSpecIds] = useState<Record<string, boolean>>({});

  const { data: clinic, isLoading: isClinicLoading } = useQuery({
    queryKey: ["clinic", user?.clinic_id],
    queryFn: async () => api.clinics.get(user!.clinic_id!),
    enabled: Boolean(user?.clinic_id && canManageClinic),
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
    mutationFn: async () =>
      api.clinics.update(user!.clinic_id!, {
        name: clinicName.trim(),
        phone: clinicPhone.trim() || undefined,
        email: clinicEmail.trim() || undefined,
        address: clinicAddress.trim() || undefined,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["clinic", user?.clinic_id] });
      toast.success(t.settingsSaved);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Klinik bilgileri kaydedilemedi");
    },
  });

  const saveAppointmentSettings = useMutation({
    mutationFn: async () =>
      api.clinics.update(user!.clinic_id!, {
        default_appointment_duration: Number(defaultAppointmentDuration),
        appointment_approval_mode: appointmentApprovalMode,
        max_booking_days_ahead: Number(maxBookingDaysAhead),
        cancellation_hours_before: Number(cancellationHoursBefore),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["clinic", user?.clinic_id] });
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
      toast.success("Klinik logosu guncellendi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Klinik logosu yuklenemedi");
    }
  };

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold" style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>{t.clinicSettings}</h1>
          <p className="text-muted-foreground mt-1" style={{ color: "#5a7a8a" }}>{t.clinicSettingsDesc}</p>
        </motion.div>

        {canManageClinic && (
          <motion.div custom={1} variants={fadeUp}>
            <Card style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", boxShadow: "0 2px 12px rgba(79,143,230,0.08)" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg" style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>
                  <Building2 className="h-5 w-5" style={{ color: "#4f8fe6" }} />
                  Klinik Profili
                </CardTitle>
                <CardDescription style={{ color: "#5a7a8a" }}>
                  Klinik adi, iletisim bilgileri, adres ve logo burada yonetilir.
                </CardDescription>
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
                      className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[20px] border border-dashed border-[#b5d1cc] bg-[#f4f8fd] transition-colors"
                      onClick={() => isOwner && clinicLogoInputRef.current?.click()}
                    >
                      {clinic?.logo_url ? (
                        <img
                          src={clinic.logo_url}
                          alt={clinic.name ?? "Klinik logosu"}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 px-3 text-center text-xs text-[#5a7a8a]">
                          <Upload className="h-5 w-5" />
                          Logo yok
                        </div>
                      )}
                    </button>
                    <div className="space-y-1 text-xs text-[#5a7a8a]">
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
                    style={{ background: "#4f8fe6", color: "white", borderRadius: "10px" }}
                  >
                    {saveClinicProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t.saveSettings}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {canManageClinic && (
          <motion.div custom={2} variants={fadeUp}>
            <Card style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", boxShadow: "0 2px 12px rgba(79,143,230,0.08)" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg" style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>
                  <Building2 className="h-5 w-5" style={{ color: "#4f8fe6" }} />
                  Randevu Ayarlari
                </CardTitle>
                <CardDescription style={{ color: "#5a7a8a" }}>
                  Randevu sureleri, onay akisi, ileri tarih siniri ve iptal deadline burada yonetilir.
                </CardDescription>
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
                    style={{ background: "#4f8fe6", color: "white", borderRadius: "10px" }}
                  >
                    {saveAppointmentSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {t.saveSettings}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {canManageClinic && (
          <motion.div custom={3} variants={fadeUp}>
            <Card style={{ background: "white", border: "1px solid #b5d1cc", borderRadius: "16px", boxShadow: "0 2px 12px rgba(79,143,230,0.08)" }}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg" style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>
                    <Shield className="h-5 w-5" style={{ color: "#4f8fe6" }} />
                    {t.ownerControls}
                  </CardTitle>
                  <CardDescription style={{ color: "#5a7a8a" }}>{t.ownerControlsDesc}</CardDescription>
                </div>
                <Badge variant="outline" style={{ background: "#eaf5ff", color: "#4f8fe6", border: "1.5px solid #b5d1cc", borderRadius: "8px", fontSize: "0.75rem" }}>{t.ownerOnly}</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium" style={{ color: "#1a2e3b", fontWeight: 600 }}>{t.specializations}</h3>
                    <p className="text-sm text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.875rem" }}>{t.specManageDesc}</p>
                  </div>
                  <button
                    onClick={() => setShowAddSpec(true)}
                    className="flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors"
                    style={{ background: "#4f8fe6" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#2f75ca"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "#4f8fe6"}
                  >
                    <Plus className="h-4 w-4" /> {t.add}
                  </button>
                </div>
                {!specializations?.length ? (
                  <p className="text-muted-foreground text-sm text-center py-4">—</p>
                ) : (
                  <div className="space-y-2">
                    {specializations.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 rounded-xl transition-colors"
                        style={{ background: "#f4f8fd", border: "1px solid #f0f4f8" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#eaf5ff"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "#f4f8fd"}
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
                                border: "2px solid #b5d1cc",
                              }}
                            />
                          ) : (
                            <div
                              className="flex h-[52px] w-[52px] items-center justify-center rounded-lg text-center text-[11px]"
                              style={{
                                background: "linear-gradient(135deg,#eaf5ff,#b5d1cc)",
                                color: "#5a7a8a",
                              }}
                            >
                              Görsel yok
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.9rem" }}>{s.name}</p>
                            {s.description && <p className="text-xs text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.78rem" }}>{s.description}</p>}
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
                            style={{
                              border: "1.5px solid #b5d1cc",
                              borderRadius: "8px",
                              padding: "3px 10px",
                              fontSize: "0.75rem",
                              color: "#5a7a8a",
                              background: "white",
                              cursor: "pointer",
                            }}
                          >
                            {uploadingSpecIds[s.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Görsel Yükle
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" style={{ color: "#e05252" }} onClick={() => deleteSpec.mutate(s.id)}>
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
            <Button variant="outline" onClick={() => setShowAddSpec(false)} style={{ border: "1.5px solid #b5d1cc", color: "#5a7a8a", borderRadius: "10px" }}>{t.cancel}</Button>
            <Button onClick={() => addSpec.mutate()} disabled={!specName.trim() || addSpec.isPending} style={{ background: "#4f8fe6", color: "white", borderRadius: "10px" }}>{t.addSpecialization}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
