import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { ApiError } from "@/services/api";
import type { AvailabilityOverride } from "@/types/calendar";
import { useLanguage } from "@/contexts/LanguageContext";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const { t } = useLanguage();
  const [date, setDate] = useState("");
  const [type, setType] = useState<"blackout" | "custom_hours">("blackout");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

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
    if (type !== "custom_hours") return "";
    if (!startTime || !endTime) return t.specialHoursRequireTimes;
    return endTime <= startTime ? t.invalidTimeRange : "";
  }, [endTime, startTime, t, type]);

  const isValid = Boolean(date) && !timeError;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isValid) throw new Error(t.invalidForm);

      const payload = {
        date,
        type,
        start_time: type === "custom_hours" ? startTime : undefined,
        end_time: type === "custom_hours" ? endTime : undefined,
        reason: reason.trim() || undefined,
      };

      if (mode === "edit" && override) {
        return api.availabilityOverrides.update(override.id, payload);
      }

      return api.availabilityOverrides.create({
        doctor_id: doctorId,
        ...payload,
      });
    },
    onSuccess: () => {
      toast.success(mode === "edit" ? t.overrideUpdated : t.overrideCreated);
      onSaved();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
        return;
      }

      toast.error(error instanceof Error ? error.message : t.overrideSaveFailed);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!override) throw new Error(t.deleteOverrideTitle);
      return api.availabilityOverrides.remove(override.id);
    },
    onSuccess: () => {
      toast.success(t.overrideRemoved);
      setConfirmDeleteOpen(false);
      onSaved();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t.overrideRemoveFailed);
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? t.overrideEditTitle : t.overrideCreateTitle}</DialogTitle>
            <DialogDescription>{t.overrideModalDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="override-date">{t.date}</Label>
              <Input id="override-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="rounded-xl" />
            </div>

            <div className="space-y-3">
              <Label>{t.overrideType}</Label>
              <RadioGroup value={type} onValueChange={(value) => setType(value as "blackout" | "custom_hours")} className="gap-3">
                <label htmlFor="override-blackout" className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                  <RadioGroupItem value="blackout" id="override-blackout" />
                  <span className="text-sm font-medium">{t.closeThisDay}</span>
                </label>
                <label htmlFor="override-custom-hours" className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                  <RadioGroupItem value="custom_hours" id="override-custom-hours" />
                  <span className="text-sm font-medium">{t.defineCustomHours}</span>
                </label>
              </RadioGroup>
            </div>

            {type === "custom_hours" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="override-start-time">{t.startTime}</Label>
                  <Input id="override-start-time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="override-end-time">{t.endTime}</Label>
                  <Input id="override-end-time" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="rounded-xl" />
                </div>
              </div>
            ) : null}

            {timeError ? <p className="text-sm text-destructive">{timeError}</p> : null}

            <div className="space-y-2">
              <Label htmlFor="override-reason">{t.reason}</Label>
              <Input
                id="override-reason"
                type="text"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={t.reasonPlaceholder}
                className="rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              {mode === "edit" && override ? (
                <Button type="button" variant="destructive" className="rounded-xl" onClick={() => setConfirmDeleteOpen(true)} disabled={saveMutation.isPending || deleteMutation.isPending}>
                  <Trash2 className="h-4 w-4" />
                  {t.delete}
                </Button>
              ) : (
                <div />
              )}

              <Button type="button" className="rounded-xl" onClick={() => saveMutation.mutate()} disabled={!isValid || saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteOverrideTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.overrideDeleteConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? t.deleting : t.delete}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
