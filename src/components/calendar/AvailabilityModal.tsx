import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { ApiError } from "@/services/api";
import type { AvailabilitySlot } from "@/types/calendar";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface AvailabilityModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  doctorId: string;
  defaultDuration: number;
  initialDayOfWeek?: number;
  initialStartTime?: string;
  initialEndTime?: string;
  slot?: AvailabilitySlot;
  onDraftChange?: (draft: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  } | null) => void;
  onSaved: () => void;
}

function to24Hour(time?: string | null) {
  return time ? time.slice(0, 5) : "";
}

export function AvailabilityModal({
  open,
  onClose,
  mode,
  doctorId,
  defaultDuration,
  initialDayOfWeek,
  initialStartTime,
  initialEndTime,
  slot,
  onDraftChange,
  onSaved,
}: AvailabilityModalProps) {
  const { t } = useLanguage();
  const dayOptions = [
    { value: "1", label: t.monday },
    { value: "2", label: t.tuesday },
    { value: "3", label: t.wednesday },
    { value: "4", label: t.thursday },
    { value: "5", label: t.friday },
    { value: "6", label: t.saturday },
    { value: "0", label: t.sunday },
  ] as const;
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const allTimes = useMemo(() => {
    const times: string[] = [];
    const startMinutes = 6 * 60;
    const endMinutes = 22 * 60;
    for (let m = startMinutes; m <= endMinutes; m += defaultDuration) {
      const h = Math.floor(m / 60).toString().padStart(2, "0");
      const min = (m % 60).toString().padStart(2, "0");
      times.push(`${h}:${min}`);
    }
    return times;
  }, [defaultDuration]);

  const endTimeOptions = useMemo(() => {
    if (!startTime) return allTimes;
    const [h, m] = startTime.split(":").map(Number);
    const startMinutes = h * 60 + m;
    return allTimes.filter((t) => {
      const [th, tm] = t.split(":").map(Number);
      return th * 60 + tm > startMinutes;
    });
  }, [allTimes, startTime]);

  useEffect(() => {
    if (!open) return;

    if (mode === "edit" && slot) {
      setDayOfWeek(String(slot.day_of_week));
      setStartTime(initialStartTime ?? to24Hour(slot.start_time));
      setEndTime(initialEndTime ?? to24Hour(slot.end_time));
      return;
    }

    setDayOfWeek(String(initialDayOfWeek ?? 1));
    setStartTime(initialStartTime ?? "");
    setEndTime(initialEndTime ?? "");
  }, [initialDayOfWeek, initialEndTime, initialStartTime, mode, open, slot]);

  useEffect(() => {
    if (!onDraftChange) {
      return;
    }

    if (!open || !dayOfWeek || !startTime || !endTime) {
      onDraftChange(null);
      return;
    }

    onDraftChange({
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime,
    });

    return () => {
      onDraftChange(null);
    };
  }, [dayOfWeek, endTime, onDraftChange, open, startTime]);

  const timeError = useMemo(() => {
    if (!startTime || !endTime) return "";
    return endTime <= startTime ? t.invalidTimeRange : "";
  }, [endTime, startTime, t]);

  const isValid = Boolean(dayOfWeek && startTime && endTime) && !timeError;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isValid) throw new Error(t.invalidForm);

      const payload = {
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
      };

      if (mode === "edit" && slot) {
        return api.availability.update(slot.id, payload);
      }

      return api.availability.create({ doctorId, ...payload });
    },
    onSuccess: () => {
      toast.success(mode === "edit" ? t.availabilityUpdated : t.availabilityCreated);
      onSaved();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error(t.duplicateAvailability);
        return;
      }

      toast.error(t.availabilitySaveFailed);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!slot) throw new Error(t.noAvailability);
      return api.availability.remove(slot.id);
    },
    onSuccess: () => {
      toast.success(t.availabilityRemoved);
      setConfirmDeleteOpen(false);
      onSaved();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : t.availabilityRemoveFailed);
    },
  });

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? t.availabilityEditTitle : t.availabilityCreateTitle}</DialogTitle>
            <DialogDescription>{t.availabilityModalDesc}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="availability-day">{t.dayOfWeek}</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger id="availability-day" className="rounded-xl">
                  <SelectValue placeholder={t.selectDay} />
                </SelectTrigger>
                <SelectContent>
                  {dayOptions.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t.startTime}</Label>
                <Select
                  value={startTime}
                  onValueChange={(val) => {
                    setStartTime(val);
                    if (endTime) {
                      const [sh, sm] = val.split(":").map(Number);
                      const [eh, em] = endTime.split(":").map(Number);
                      if (eh * 60 + em <= sh * 60 + sm) setEndTime("");
                    }
                  }}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="--:--" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTimes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.endTime}</Label>
                <Select value={endTime} onValueChange={setEndTime} disabled={!startTime}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="--:--" />
                  </SelectTrigger>
                  <SelectContent>
                    {endTimeOptions.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {timeError ? <p className="text-sm text-destructive">{timeError}</p> : null}

            <div className="flex items-center justify-between gap-3 pt-2">
              {mode === "edit" && slot ? (
                <Button type="button" variant="destructive" className="rounded-xl" onClick={() => setConfirmDeleteOpen(true)} disabled={deleteMutation.isPending || saveMutation.isPending}>
                  <Trash2 className="h-4 w-4" />
                  {t.delete}
                </Button>
              ) : (
                <div />
              )}

              <Button type="button" className="rounded-xl" onClick={() => saveMutation.mutate()} disabled={!isValid || saveMutation.isPending || deleteMutation.isPending}>
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
            <AlertDialogTitle>{t.deleteAvailabilityTitle}</AlertDialogTitle>
            <AlertDialogDescription>{t.availabilityDeleteConfirm}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
