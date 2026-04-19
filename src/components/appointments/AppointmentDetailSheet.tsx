import { useEffect, useState, type ElementType } from "react";
import { format, parseISO } from "date-fns";
import { enUS, tr as trLocale } from "date-fns/locale";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Appointment } from "@/types/calendar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";

const STATUS_COLORS: Record<string, string> = {
  pending: "#d4943a",
  confirmed: "#4f8fe6",
  completed: "#65a98f",
  cancelled: "#5a7a8a",
};

const AVATAR_PALETTE = [
  { bg: "#DBEAFE", text: "#1E40AF" },
  { bg: "#D1FAE5", text: "#065F46" },
  { bg: "#EDE9FE", text: "#5B21B6" },
  { bg: "#FEF3C7", text: "#92400E" },
  { bg: "#FCE7F3", text: "#9D174D" },
  { bg: "#FFEDD5", text: "#9A3412" },
  { bg: "#E0F2FE", text: "#075985" },
];

function getAvatarColor(seed: string): { bg: string; text: string } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h * 31) + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

export interface AppointmentDetailSheetProps {
  appointment: Appointment | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate?: (id: string, status: string) => void;
}

export function AppointmentDetailSheet({
  appointment,
  open,
  onClose,
  onStatusUpdate,
}: AppointmentDetailSheetProps) {
  const { lang, t } = useLanguage();
  const locale = lang === "tr" ? trLocale : enUS;

  // Normalize "canceled" (backend typo) to "cancelled"
  const statusKey = appointment?.status === "canceled" ? "cancelled" : appointment?.status;

  // Smart transitions: only show valid next states
  const VALID_TRANSITIONS: Record<string, string[]> = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  };

  // Visual config for each transition button
  const TRANSITION_META: Record<string, { label: string; base: string; selected: string }> = {
    confirmed: {
      label: "Onayla",
      base: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
      selected: "border-emerald-600 bg-emerald-600 text-white",
    },
    completed: {
      label: "Tamamland\u0131",
      base: "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100",
      selected: "border-blue-600 bg-blue-600 text-white",
    },
    cancelled: {
      label: "\u0130ptal Et",
      base: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
      selected: "border-red-600 bg-red-600 text-white",
    },
  };

  const validTransitions = VALID_TRANSITIONS[statusKey ?? ""] ?? [];
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  useEffect(() => {
    setPendingStatus(null);
  }, [appointment?.id, open]);

  const statusConfig: Record<string, { color: string; icon: ElementType; label: string }> = {
    pending: { color: STATUS_COLORS.pending, icon: AlertCircle, label: t.pending },
    confirmed: { color: STATUS_COLORS.confirmed, icon: CheckCircle2, label: t.confirmed },
    completed: { color: STATUS_COLORS.completed, icon: CheckCircle2, label: t.completed },
    cancelled: { color: STATUS_COLORS.cancelled, icon: XCircle, label: t.cancelled },
  };

  const patientName = (
    appointment?.patient.fullName
    ?? [appointment?.patient.firstName, appointment?.patient.lastName].filter(Boolean).join(" ").trim()
  ) || t.patient;
  const status = statusKey ? statusConfig[statusKey] : null;
  const StatusIcon = status?.icon;

  const handleSave = () => {
    if (!pendingStatus || !appointment) return;
    onStatusUpdate?.(appointment.id, pendingStatus);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[520px] w-full p-0 overflow-hidden rounded-[28px] gap-0 border border-border/60 shadow-2xl">
        {appointment && status && StatusIcon ? (
          <>
            <DialogHeader className="p-0 text-left">
              {/* HEADER */}
              <div className="px-6 pt-6 pb-5">
                {/* Status badge */}
                <div className="mb-5">
                  <Badge
                    variant="outline"
                    className="rounded-full border text-[12px] font-medium px-3 py-1"
                    style={{
                      backgroundColor: `${status.color}18`,
                      borderColor: `${status.color}40`,
                      color: status.color,
                    }}
                  >
                    <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                    {status.label}
                  </Badge>
                </div>

                {/* Patient */}
                <div className="flex items-center gap-4">
                  {(() => {
                    const av = getAvatarColor(appointment.patient.id ?? patientName);
                    return (
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold select-none"
                        style={{ backgroundColor: av.bg, color: av.text }}
                      >
                        {patientName[0]?.toUpperCase() ?? "P"}
                      </div>
                    );
                  })()}
                  <div className="min-w-0">
                    <p className="text-xl font-semibold text-foreground truncate leading-tight">{patientName}</p>
                    {appointment.patient.email ? (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{appointment.patient.email}</p>
                    ) : null}
                    {appointment.patient.phone ? (
                      <p className="text-sm text-muted-foreground mt-0.5">{appointment.patient.phone}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* INFO GRID */}
            <div className="px-6 pb-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-muted/50 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">Tarih</p>
                <p className="text-sm font-semibold text-foreground leading-snug">
                  {format(parseISO(appointment.appointment_date), "EEE, d MMM yyyy", { locale })}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/50 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">Saat</p>
                <p className="text-sm font-semibold text-foreground leading-snug">
                  {appointment.start_time.slice(0, 5)} {"\u2013"} {appointment.end_time.slice(0, 5)}
                </p>
                {(() => {
                  const [sh, sm] = appointment.start_time.split(":").map(Number);
                  const [eh, em] = appointment.end_time.split(":").map(Number);
                  const dur = (eh * 60 + em) - (sh * 60 + sm);
                  return dur > 0 ? (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{dur} dk</p>
                  ) : null;
                })()}
              </div>
              {appointment.notes ? (
                <div className="col-span-2 rounded-2xl bg-muted/50 p-3.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-1.5">Not</p>
                  <p className="text-sm text-foreground leading-relaxed">{appointment.notes}</p>
                </div>
              ) : null}
            </div>

            {/* STATUS SECTION */}
            <div className="border-t border-border/50" />
            <div className="px-6 py-5">
              {validTransitions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-1">
                  {statusKey === "completed"
                    ? "Bu randevu tamamland\u0131, durum de\u011fi\u015ftirilemez."
                    : "Bu randevu iptal edildi, durum de\u011fi\u015ftirilemez."}
                </p>
              ) : (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
                    Durum G\u00fcncelle
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {validTransitions.map((s) => {
                      const meta = TRANSITION_META[s];
                      if (!meta) return null;
                      const isSelected = pendingStatus === s;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setPendingStatus(isSelected ? null : s)}
                          className={cn(
                            "flex-1 min-w-[110px] rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-150",
                            isSelected ? meta.selected : meta.base,
                          )}
                        >
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    disabled={!pendingStatus}
                    onClick={handleSave}
                    className={cn(
                      "mt-3 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150",
                      pendingStatus
                        ? "bg-foreground text-background hover:opacity-90 cursor-pointer"
                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-60",
                    )}
                  >
                    {pendingStatus ? "De\u011fi\u015fikli\u011fi Kaydet" : "Bir durum se\u00e7in"}
                  </button>
                </>
              )}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
