import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api, { ApiError } from "@/services/api";
import type { AvailabilitySlot } from "@/types/calendar";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AvailabilityModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  doctorId: string;
  initialDayOfWeek?: number;
  initialStartTime?: string;
  initialEndTime?: string;
  slot?: AvailabilitySlot;
  onDraftChange?: (draft: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
  } | null) => void;
  onSaved: () => void;
}

const dayOptions = [
  { value: "1", label: "Pazartesi" },
  { value: "2", label: "Sali" },
  { value: "3", label: "Carsamba" },
  { value: "4", label: "Persembe" },
  { value: "5", label: "Cuma" },
  { value: "6", label: "Cumartesi" },
  { value: "0", label: "Pazar" },
] as const;

const slotDurationOptions = ["15", "20", "30", "45", "60", "90"] as const;

function to24Hour(time?: string | null) {
  return time ? time.slice(0, 5) : "";
}

function addMinutesToTime(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const normalizedMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const nextHours = Math.floor(normalizedMinutes / 60);
  const nextMinutes = normalizedMinutes % 60;

  return `${String(nextHours).padStart(2, "0")}:${String(nextMinutes).padStart(2, "0")}`;
}

function getMinutesBetween(startTime: string, endTime: string) {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);
  return endHours * 60 + endMinutes - (startHours * 60 + startMinutes);
}

export function AvailabilityModal({
  open,
  onClose,
  mode,
  doctorId,
  initialDayOfWeek,
  initialStartTime,
  initialEndTime,
  slot,
  onDraftChange,
  onSaved,
}: AvailabilityModalProps) {
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [slotDuration, setSlotDuration] = useState("30");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isEndTimeLinked, setIsEndTimeLinked] = useState(true);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && slot) {
      const nextStartTime = to24Hour(slot.start_time);
      const nextEndTime = to24Hour(slot.end_time);
      const nextSlotDuration = String(slot.slot_duration);

      setDayOfWeek(String(slot.day_of_week));
      setStartTime(nextStartTime);
      setEndTime(nextEndTime);
      setSlotDuration(nextSlotDuration);
      setIsEndTimeLinked(addMinutesToTime(nextStartTime, slot.slot_duration) === nextEndTime);
      return;
    }

    const nextStartTime = initialStartTime ?? "";
    const nextSlotDuration = "30";
    const nextSelectionDuration =
      nextStartTime && initialEndTime ? getMinutesBetween(nextStartTime, initialEndTime) : 0;
    const nextEndTime =
      initialEndTime ??
      (nextStartTime ? addMinutesToTime(nextStartTime, Number(nextSlotDuration)) : "");

    setDayOfWeek(String(initialDayOfWeek ?? 1));
    setStartTime(nextStartTime);
    setEndTime(nextEndTime);
    setSlotDuration("30");
    setIsEndTimeLinked(Boolean(nextStartTime) && nextSelectionDuration === Number(nextSlotDuration));
  }, [initialDayOfWeek, initialEndTime, initialStartTime, mode, open, slot]);

  useEffect(() => {
    if (!open || !isEndTimeLinked || !startTime || !slotDuration) {
      return;
    }

    const syncedEndTime = addMinutesToTime(startTime, Number(slotDuration));
    if (endTime !== syncedEndTime) {
      setEndTime(syncedEndTime);
    }
  }, [endTime, isEndTimeLinked, open, slotDuration, startTime]);

  useEffect(() => {
    if (!onDraftChange) {
      return;
    }

    if (!open || !dayOfWeek || !startTime || !slotDuration) {
      onDraftChange(null);
      return;
    }

    onDraftChange({
      dayOfWeek: Number(dayOfWeek),
      startTime,
      endTime: endTime || addMinutesToTime(startTime, Number(slotDuration)),
      slotDuration: Number(slotDuration),
    });

    return () => {
      onDraftChange(null);
    };
  }, [dayOfWeek, endTime, onDraftChange, open, slotDuration, startTime]);

  const timeError = useMemo(() => {
    if (!startTime || !endTime) {
      return "";
    }

    if (endTime <= startTime) {
      return "Bitis saati baslangic saatinden sonra olmalidir.";
    }

    return "";
  }, [endTime, startTime]);

  const isValid = Boolean(dayOfWeek && startTime && endTime && slotDuration) && !timeError;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!isValid) {
        throw new Error("Form bilgileri gecersiz");
      }

      const payload = {
        dayOfWeek: Number(dayOfWeek),
        startTime,
        endTime,
        slotDuration: Number(slotDuration),
      };

      if (mode === "edit" && slot) {
        return api.availability.update(slot.id, payload);
      }

      return api.availability.create({
        doctorId,
        ...payload,
      });
    },
    onSuccess: () => {
      toast.success(mode === "edit" ? "Musaitlik guncellendi" : "Musaitlik eklendi");
      onSaved();
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("Bu gün ve saat aralığında zaten aktif bir müsaitlik slotu mevcut.");
      } else {
        toast.error("Müsaitlik kaydedilemedi.");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!slot) {
        throw new Error("Silinecek musaitlik bulunamadi");
      }

      return api.availability.remove(slot.id);
    },
    onSuccess: () => {
      toast.success("Musaitlik silindi");
      setConfirmDeleteOpen(false);
      onSaved();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Musaitlik silinemedi");
    },
  });

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            onClose();
          }
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Musaitligi Duzenle" : "Musaitlik Ekle"}</DialogTitle>
            <DialogDescription>
              {mode === "edit"
                ? "Secili recurring musaitlik kaydini duzenleyin."
                : "Yeni recurring musaitlik araligini ve randevu slot suresini belirleyin."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="availability-day">Gun</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger id="availability-day" className="rounded-xl">
                  <SelectValue placeholder="Gun secin" />
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
                <Label htmlFor="availability-start">Baslangic saati</Label>
                <Input
                  id="availability-start"
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability-end">Bitis saati</Label>
                <Input
                  id="availability-end"
                  type="time"
                  value={endTime}
                  onChange={(event) => {
                    setEndTime(event.target.value);
                    setIsEndTimeLinked(false);
                  }}
                  className="rounded-xl"
                />
              </div>
            </div>

            {timeError ? (
              <p className="text-sm text-destructive">{timeError}</p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="availability-slot-duration">Slot suresi</Label>
              <Select value={slotDuration} onValueChange={setSlotDuration}>
                <SelectTrigger id="availability-slot-duration" className="rounded-xl">
                  <SelectValue placeholder="Sure secin" />
                </SelectTrigger>
                <SelectContent>
                  {slotDurationOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option} dakika
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              {mode === "edit" && slot ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-xl"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={deleteMutation.isPending || saveMutation.isPending}
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
                disabled={!isValid || saveMutation.isPending || deleteMutation.isPending}
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {mode === "edit" ? "Guncelle" : "Kaydet"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Musaitlik silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu slot silindiginde ilgili gun ve saat araligi takvimden kaldirilir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Iptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                deleteMutation.mutate();
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
