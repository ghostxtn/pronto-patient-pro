import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
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
      setReason(override.reason ?? "");
      return;
    }

    setDate(initialDate ?? "");
    setType(initialType);
    setStartTime("");
    setEndTime("");
    setReason("");
  }, [initialDate, initialType, mode, open, override]);

  const timeError = useMemo(() => {
    if (type !== "custom_hours") {
      return "";
    }

    if (!startTime || !endTime) {
      return "Özel saat için başlangıç ve bitiş saati zorunludur.";
    }

    if (endTime <= startTime) {
      return "Bitiş saati başlangıç saatinden sonra olmalıdır.";
    }

    return "";
  }, [endTime, startTime, type]);

  const isValid = Boolean(date) && !timeError;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isValid) {
        throw new Error("Form bilgileri geçersiz");
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

      if (type === "custom_hours") {
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
      toast.success(mode === "edit" ? "İstisna güncellendi" : "İstisna eklendi");
      onSaved();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error(error instanceof Error ? error.message : "Hata oluştu");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!override) {
        throw new Error("Silinecek istisna bulunamadı");
      }

      return api.availabilityOverrides.remove(override.id);
    },
    onSuccess: () => {
      toast.success("İstisna silindi");
      setConfirmDeleteOpen(false);
      onSaved();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "İstisna silinemedi");
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "İstisnayı Düzenle" : "İstisna Ekle"}</DialogTitle>
            <DialogDescription>
              Belirli bir günü kapatın veya o gün için özel çalışma saati tanımlayın.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="override-date">Tarih</Label>
              <Input
                id="override-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-3">
              <Label>Tür</Label>
              <RadioGroup
                value={type}
                onValueChange={(value) => setType(value as "blackout" | "custom_hours")}
                className="gap-3"
              >
                <label htmlFor="override-blackout" className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                  <RadioGroupItem value="blackout" id="override-blackout" />
                  <span className="text-sm font-medium">Bu günü kapat (Blackout)</span>
                </label>
                <label htmlFor="override-custom-hours" className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                  <RadioGroupItem value="custom_hours" id="override-custom-hours" />
                  <span className="text-sm font-medium">Özel saat belirle (Custom hours)</span>
                </label>
              </RadioGroup>
            </div>

            {type === "custom_hours" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="override-start-time">Başlangıç saati</Label>
                  <Input
                    id="override-start-time"
                    type="time"
                    value={startTime}
                    onChange={(event) => setStartTime(event.target.value)}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="override-end-time">Bitiş saati</Label>
                  <Input
                    id="override-end-time"
                    type="time"
                    value={endTime}
                    onChange={(event) => setEndTime(event.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            ) : null}

            {timeError ? <p className="text-sm text-destructive">{timeError}</p> : null}

            <div className="space-y-2">
              <Label htmlFor="override-reason">Sebep</Label>
              <Input
                id="override-reason"
                type="text"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="örn. Tatil, Toplantı"
                className="rounded-xl"
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
                  <Trash2 className="h-4 w-4" />
                  Sil
                </Button>
              ) : (
                <div />
              )}

              <Button
                type="button"
                className="rounded-xl"
                onClick={() => saveMutation.mutate()}
                disabled={!isValid || saveMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Kaydet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İstisna silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem seçili istisnayı kalıcı olarak kaldırır.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
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
