import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CalendarDays, Clock3, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { ApiError } from "@/services/api";
import type { AvailabilityOverride } from "@/types/calendar";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

export interface OverrideModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  doctorId: string;
  initialDate?: string;
  initialType?: "blackout" | "custom_hours";
  override?: AvailabilityOverride;
  onSaved: () => void;
}

function toTimeValue(time?: string | null) {
  return time ? time.slice(0, 5) : "";
}

export function OverrideModal({
  open,
  onClose,
  mode,
  doctorId,
  initialDate,
  initialType = "blackout",
  override,
  onSaved,
}: OverrideModalProps) {
  const [date, setDate] = useState("");
  const [type, setType] = useState<"blackout" | "custom_hours">("blackout");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [isAllDayBlackout, setIsAllDayBlackout] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && override) {
      setDate(override.date);
      setType(override.type);
      setStartTime(toTimeValue(override.start_time));
      setEndTime(toTimeValue(override.end_time));
      setIsAllDayBlackout(Boolean(override.type === "blackout" && !override.start_time && !override.end_time));
      setReason(override.reason ?? "");
      return;
    }

    setDate(initialDate ?? "");
    setType(initialType);
    setStartTime("");
    setEndTime("");
    setIsAllDayBlackout(initialType === "blackout");
    setReason("");
  }, [initialDate, initialType, mode, open, override]);

  const timeError = useMemo(() => {
    if (type === "blackout" && isAllDayBlackout) {
      return "";
    }

    if (!startTime || !endTime) {
      return "Ozel saat veya blok araligi icin baslangic ve bitis saati zorunludur.";
    }

    if (endTime <= startTime) {
      return "Bitis saati baslangic saatinden sonra olmalidir.";
    }

    return "";
  }, [endTime, isAllDayBlackout, startTime, type]);

  const isValid = Boolean(date) && !timeError;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isValid) {
        throw new Error("Form bilgileri gecersiz");
      }

      const payload: {
        date: string;
        type: "blackout" | "custom_hours";
        start_time?: string;
        end_time?: string;
        reason?: string;
      } = {
        date,
        type,
      };

      if (type === "custom_hours" || (type === "blackout" && !isAllDayBlackout)) {
        payload.start_time = startTime;
        payload.end_time = endTime;
      }

      if (reason.trim()) {
        payload.reason = reason.trim();
      }

      if (mode === "edit" && override) {
        return api.availabilityOverrides.update(override.id, payload);
      }

      return api.availabilityOverrides.create({
        doctor_id: doctorId,
        date: payload.date,
        type: payload.type,
        start_time: payload.start_time,
        end_time: payload.end_time,
        reason: payload.reason,
      });
    },
    onSuccess: () => {
      toast.success(mode === "edit" ? "Istisna guncellendi" : "Istisna eklendi");
      onSaved();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(error instanceof Error ? error.message : "Hata olustu");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!override) {
        throw new Error("Silinecek istisna bulunamadi");
      }

      return api.availabilityOverrides.remove(override.id);
    },
    onSuccess: () => {
      toast.success("Istisna silindi");
      setConfirmDeleteOpen(false);
      onSaved();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Istisna silinemedi");
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogContent className="calendar-suite-dialog sm:max-w-2xl border-0 p-0">
          <div className="calendar-suite-dialog-header px-6 py-5">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold text-white">
                {type === "blackout" ? "Takvim Blokaji" : "Ozel Saat Tanimi"}
              </DialogTitle>
              <DialogDescription className="text-blue-50">
                Secili tarih ve zaman araligini operasyon yuzeyinde net sekilde yonetin.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="calendar-suite-subpanel p-4">
                <Label htmlFor="override-date" className="calendar-suite-label">Secili Tarih</Label>
                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                  <CalendarDays className="h-4 w-4 text-slate-400" />
                  <Input
                    id="override-date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="calendar-suite-subpanel p-4">
                <Label className="calendar-suite-label">Tur</Label>
                <RadioGroup
                  value={type}
                  onValueChange={(value) => setType(value as "blackout" | "custom_hours")}
                  className="mt-3 gap-3"
                >
                  <label htmlFor="override-blackout" className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                    <RadioGroupItem value="blackout" id="override-blackout" />
                    <span className="text-sm font-medium text-slate-800">Blokaj</span>
                  </label>
                  <label htmlFor="override-custom-hours" className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                    <RadioGroupItem value="custom_hours" id="override-custom-hours" />
                    <span className="text-sm font-medium text-slate-800">Ozel Saat</span>
                  </label>
                </RadioGroup>
              </div>
            </div>

            {type === "blackout" ? (
              <div className="calendar-suite-subpanel flex items-center justify-between gap-4 p-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Tam gun blokaj</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Kapali gun yerine saat araligi bloklamak isterseniz bu secenegi kapatin.
                  </div>
                </div>
                <Switch checked={isAllDayBlackout} onCheckedChange={setIsAllDayBlackout} />
              </div>
            ) : null}

            {type === "custom_hours" || (type === "blackout" && !isAllDayBlackout) ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="calendar-suite-subpanel p-4">
                  <Label htmlFor="override-start-time" className="calendar-suite-label">Baslangic</Label>
                  <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                    <Clock3 className="h-4 w-4 text-slate-400" />
                    <Input
                      id="override-start-time"
                      type="time"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>

                <div className="calendar-suite-subpanel p-4">
                  <Label htmlFor="override-end-time" className="calendar-suite-label">Bitis</Label>
                  <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
                    <Clock3 className="h-4 w-4 text-slate-400" />
                    <Input
                      id="override-end-time"
                      type="time"
                      value={endTime}
                      onChange={(event) => setEndTime(event.target.value)}
                      className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {timeError ? <p className="text-sm text-destructive">{timeError}</p> : null}

            <div className="calendar-suite-subpanel p-4">
              <Label htmlFor="override-reason" className="calendar-suite-label">Neden / Kisa Not</Label>
              <Input
                id="override-reason"
                type="text"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Orn. teknik bakim, toplantı, seminer"
                className="mt-3 rounded-2xl border-slate-200 bg-white"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              {mode === "edit" && override ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-xl"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={saveMutation.isPending || deleteMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Sil
                </Button>
              ) : (
                <Button type="button" variant="ghost" className="rounded-xl text-slate-600" onClick={onClose}>
                  Vazgec
                </Button>
              )}

              <Button
                type="button"
                className="h-12 rounded-2xl px-6"
                onClick={() => saveMutation.mutate()}
                disabled={!isValid || saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {type === "blackout" ? "Blokaji Kaydet" : "Ozel Saati Kaydet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Istisna silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu islem secili istisnayi kalici olarak kaldirir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Iptal</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Siliniyor..." : "Sil"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
