import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Trash2, CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface OverrideModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  doctorId: string;
  defaultDuration: number;
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
  defaultDuration,
  initialDate,
  initialType = "blackout",
  override,
  onSaved,
}: OverrideModalProps) {
  const { t } = useLanguage();
  const [date, setDate] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [type, setType] = useState<"blackout" | "custom_hours">("blackout");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
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
        reason: reason || undefined,
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
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader className="pb-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-1">
              {t.overrideType}
            </p>
            <DialogTitle className="font-display text-xl">
              {mode === "edit" ? t.overrideEditTitle : t.overrideCreateTitle}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t.overrideModalDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 px-6 py-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="override-date">{t.date}</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="override-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-xl h-11",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? (
                        format(parseISO(date + "T00:00:00"), "d MMMM yyyy", { locale: tr })
                      ) : (
                        <span>Tarih Seçin</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date ? parseISO(date + "T00:00:00") : undefined}
                      onSelect={(nextDate) => {
                        if (nextDate) {
                          setDate(format(nextDate, "yyyy-MM-dd"));
                          setCalendarOpen(false);
                        }
                      }}
                      initialFocus
                      locale={tr}
                      weekStartsOn={1}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Sebep / Not</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Bu bloğun sebebini yazın..."
                  className="rounded-xl resize-none text-sm"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Takvimde görünmez, sadece kayıt amaçlıdır.
                </p>
              </div>

              <Separator className="my-1" />

              <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 space-y-4">
                <div className="space-y-3">
                  <Label>{t.overrideType}</Label>
                  <RadioGroup
                    value={type}
                    onValueChange={(value) => setType(value as "blackout" | "custom_hours")}
                    className="gap-3"
                  >
                    <label
                      htmlFor="override-blackout"
                      className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-3 cursor-pointer hover:bg-destructive/10 transition-colors"
                    >
                      <RadioGroupItem value="blackout" id="override-blackout" />
                      <span className="text-sm font-medium">{t.closeThisDay}</span>
                    </label>
                    <label
                      htmlFor="override-custom-hours"
                      className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30 p-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                    >
                      <RadioGroupItem value="custom_hours" id="override-custom-hours" />
                      <span className="text-sm font-medium">{t.defineCustomHours}</span>
                    </label>
                  </RadioGroup>
                </div>

                {type === "custom_hours" ? (
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
                ) : null}
              </div>

              {timeError ? <p className="text-sm text-destructive">{timeError}</p> : null}
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
                  {t.delete}
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
