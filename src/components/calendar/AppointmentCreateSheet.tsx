import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface AppointmentCreateSheetProps {
  open: boolean;
  onClose: () => void;
  doctorId: string;
  selectedDate: string;   // "yyyy-MM-dd"
  selectedStart: string;  // "HH:mm"
  selectedEnd: string;    // "HH:mm"
}

export function AppointmentCreateSheet({
  open,
  onClose,
  doctorId,
  selectedDate,
  selectedStart,
  selectedEnd,
}: AppointmentCreateSheetProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [notes, setNotes] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // New Patient State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPatientError, setNewPatientError] = useState("");

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDebouncedSearch("");
      setPatients([]);
      setSelectedPatient(null);
      setNotes("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setNewPatientError("");
      setIsSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      setIsSearching(true);
      api.patients
        .list({ search: debouncedSearch })
        .then((res: any) => {
          const data = Array.isArray(res) ? res : res.data || [];
          setPatients(data);
        })
        .catch(() => {
          toast.error("Hastalar aranırken hata oluştu.");
        })
        .finally(() => setIsSearching(false));
    } else {
      setPatients([]);
    }
  }, [debouncedSearch]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatient) throw new Error("Hasta seçilmedi");
      return api.appointments.create({
        patientId: selectedPatient.id,
        doctorId,
        appointmentDate: selectedDate,
        startTime: selectedStart,
        endTime: selectedEnd,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Randevu oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-calendar"] });
      onClose();
    },
    onError: (error: any) => {
      if (error?.status === 409) {
        toast.error("Seçilen saatte doktorun randevusu veya izni var.");
      } else {
        toast.error(error?.message || "Randevu oluşturulamadı");
      }
    },
  });

  const handleCreateNewPatient = async () => {
    setNewPatientError("");
    if (!firstName.trim() || !lastName.trim()) {
      setNewPatientError("Ad ve Soyad alanları zorunludur.");
      return;
    }

    setIsSubmitting(true);
    try {
      const createdPatient = await api.patients.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
      });

      await api.appointments.create({
        patientId: createdPatient.id,
        doctorId,
        appointmentDate: selectedDate,
        startTime: selectedStart,
        endTime: selectedEnd,
        notes: notes.trim() || undefined,
      });

      toast.success("Randevu oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-calendar"] });
      onClose();
    } catch (error: any) {
      if (error?.status === 409) {
        toast.error("Seçilen saatte doktorun randevusu veya izni var.");
      } else {
        toast.error(error?.message || "İşlem sırasında bir hata oluştu.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Randevu Oluştur</SheetTitle>
          <SheetDescription>
            Hasta seçin ve randevu notlarını ekleyin.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="rounded-xl bg-muted p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tarih</span>
              <span className="font-medium">{selectedDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Saat</span>
              <span className="font-medium">
                {selectedStart} - {selectedEnd}
              </span>
            </div>
          </div>

          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="search">Kayıtlı Hasta Ara</TabsTrigger>
              <TabsTrigger value="new">Yeni Hasta Ekle</TabsTrigger>
            </TabsList>
            <TabsContent value="search" className="space-y-4">
              <div className="space-y-3">
                <Label>Hasta Seçimi</Label>
                {selectedPatient ? (
                  <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3">
                    <div>
                      <div className="font-medium">
                        {selectedPatient.firstName} {selectedPatient.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedPatient.phone || "Telefon yok"}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPatient(null)}
                    >
                      Değiştir
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="İsim, soyisim veya telefon ile ara..."
                        className="pl-9 rounded-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                      )}
                    </div>
                    {patients.length > 0 && (
                      <div className="rounded-xl border border-border/70 bg-background overflow-hidden max-h-48 overflow-y-auto">
                        {patients.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full flex flex-col p-3 text-left hover:bg-muted transition-colors border-b last:border-0"
                            onClick={() => {
                              setSelectedPatient(p);
                              setSearch("");
                              setDebouncedSearch("");
                              setPatients([]);
                            }}
                          >
                            <span className="font-medium text-sm">
                              {p.firstName} {p.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {p.phone || "Telefon yok"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {debouncedSearch.length >= 2 && !isSearching && patients.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Sonuç bulunamadı
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="appointment-notes">Notlar (İsteğe bağlı)</Label>
                <Textarea
                  id="appointment-notes"
                  className="rounded-xl"
                  placeholder="Randevu ile ilgili notlar..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                type="button"
                className="w-full rounded-xl"
                disabled={!selectedPatient || createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                {createMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Randevu Oluştur
              </Button>
            </TabsContent>

            <TabsContent value="new" className="space-y-4">
              {newPatientError && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
                  {newPatientError}
                </div>
              )}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Ad</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Hastanın adı"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Soyad</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Hastanın soyadı"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="555 555 55 55"
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2 pt-2">
                  <Label htmlFor="new-appointment-notes">Notlar (İsteğe bağlı)</Label>
                  <Textarea
                    id="new-appointment-notes"
                    className="rounded-xl"
                    placeholder="Randevu ile ilgili notlar..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <Button
                type="button"
                className="w-full rounded-xl mt-4"
                disabled={isSubmitting}
                onClick={handleCreateNewPatient}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Hasta Ekle ve Randevu Oluştur
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
