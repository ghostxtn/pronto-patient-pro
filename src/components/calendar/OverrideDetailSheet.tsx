import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/services/api";
import type { AvailabilityOverride } from "@/types/calendar";

interface OverrideDetailSheetProps {
  override: AvailabilityOverride | null;
  open: boolean;
  onClose: () => void;
  doctorId: string;
}

export function OverrideDetailSheet({
  override,
  open,
  onClose,
  doctorId,
}: OverrideDetailSheetProps) {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => api.availabilityOverrides.remove(override!.id),
    onSuccess: () => {
      toast.success("İstisna silindi");
      queryClient.invalidateQueries({ queryKey: ["calendar", doctorId] });
      onClose();
    },
    onError: () => {
      toast.error("Silinemedi");
    },
  });

  if (!override) return null;

  const isBlackout = override.type === "blackout";
  const label = isBlackout ? "Kapalı Gün" : "Özel Saat";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>İstisna Detayı</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="rounded-xl bg-muted p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tür</span>
              <Badge variant="outline" className={isBlackout 
                ? "border-destructive/30 bg-destructive/10 text-destructive" 
                : "border-warning/30 bg-warning/10 text-warning"
              }>
                {label}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tarih</span>
              <span className="text-sm font-medium">{override.date}</span>
            </div>
            {!isBlackout && override.start_time && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Saat</span>
                <span className="text-sm font-medium">
                  {override.start_time} – {override.end_time}
                </span>
              </div>
            )}
            {override.reason && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sebep</span>
                <span className="text-sm font-medium">{override.reason}</span>
              </div>
            )}
          </div>

          {!confirmDelete ? (
            <Button
              variant="outline"
              className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => setConfirmDelete(true)}
            >
              İstisnayı Sil
            </Button>
          ) : (
            <div className="rounded-xl border border-border p-4 space-y-3">
              <p className="text-sm text-foreground font-medium">
                Bu istisnayı silmek istediğinize emin misiniz?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setConfirmDelete(false)}
                >
                  İptal
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  Evet, Sil
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}