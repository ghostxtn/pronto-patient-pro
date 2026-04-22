import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Edit, Search, Trash2, UserCheck, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import api from "@/services/api";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function humanizeError(err: any): string {
  const raw = err?.response?.data?.message ?? err?.message;
  const messages = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const first = messages[0];
  return first || "Bir hata oluştu. Lütfen tekrar deneyin.";
}

type StaffCreateFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type StaffEditFormState = StaffCreateFormState & {
  isActive: boolean;
};

const emptyStaffForm: StaffCreateFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};

export default function ManageStaff() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");
  const [addOpen, setAddOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<StaffCreateFormState>(emptyStaffForm);
  const [editStaff, setEditStaff] = useState<(StaffEditFormState & { id: string }) | null>(null);

  const { data: staff = [] } = useQuery({
    queryKey: ["admin-staff", search, statusFilter],
    queryFn: () => api.staff.list({ search, status: statusFilter }),
  });

  const createStaff = useMutation({
    mutationFn: async (payload: StaffCreateFormState) => {
      try {
        return await api.staff.create(payload);
      } catch (err: any) {
        toast.error(humanizeError(err));
        throw err;
      }
    },
    onSuccess: (createdStaff) => {
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
      setAddOpen(false);
      setNewStaff(emptyStaffForm);
      toast.success(
        createdStaff?.temporaryPassword
          ? `${t.staffCreated} ${t.temporaryPasswordLabel}: ${createdStaff.temporaryPassword}`
          : t.staffCreated,
      );
    },
  });

  const updateStaff = useMutation({
    mutationFn: async (payload: StaffEditFormState & { id: string }) => {
      try {
        return await api.staff.update(payload.id, payload);
      } catch (err: any) {
        toast.error(humanizeError(err));
        throw err;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
      setEditStaff(null);
      toast.success(t.staffUpdated);
    },
  });

  const setStaffStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      try {
        return await api.staff.setStatus(id, isActive);
      } catch (err: any) {
        toast.error(humanizeError(err));
        throw err;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
      toast.success(t.staffStatusUpdated);
    },
  });

  const deleteStaff = useMutation({
    mutationFn: async (id: string) => {
      try {
        return await api.staff.delete(id);
      } catch (err: any) {
        toast.error(humanizeError(err));
        throw err;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
      toast.success(t.staffDeleted);
    },
  });

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground" style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700 }}>
                {t.manageStaff}
              </h1>
              <p className="mt-1 text-muted-foreground">{staff.length} {t.registeredStaff}</p>
            </div>

            <button
              onClick={() => {
                setNewStaff(emptyStaffForm);
                setAddOpen(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <UserPlus className="h-4 w-4" />
              {t.addStaff}
            </button>
          </div>
        </motion.div>

        <motion.div custom={1} variants={fadeUp} className="mb-4 flex gap-2">
          {(["active", "inactive", "all"] as const).map((filterValue) => (
            <button
              key={filterValue}
              onClick={() => setStatusFilter(filterValue)}
              className={cn(
                "rounded-[10px] border px-[18px] py-[6px] text-sm font-medium transition-all",
                statusFilter === filterValue
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/70",
              )}
            >
              {filterValue === "active" ? t.active : filterValue === "inactive" ? t.inactive : t.all}
            </button>
          ))}
        </motion.div>

        <motion.div custom={2} variants={fadeUp} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.searchByNameOrEmail}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
          />
        </motion.div>

        <motion.div custom={3} variants={fadeUp}>
          <Card className="overflow-visible rounded-2xl border border-border bg-card shadow-sm">
            <CardContent className="p-0">
              <div className="max-h-[560px] overflow-x-auto overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-left">
                      <th className="p-4 text-sm font-medium text-muted-foreground">{t.name}</th>
                      <th className="hidden p-4 text-sm font-medium text-muted-foreground md:table-cell">{t.email}</th>
                      <th className="hidden p-4 text-sm font-medium text-muted-foreground lg:table-cell">{t.phone}</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">{t.status}</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((member: any) => {
                      const fullName = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || "Unknown";

                      return (
                        <tr key={member.id} className="border-b border-border bg-card transition-colors last:border-0 hover:bg-muted/40">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] border-2 border-border bg-primary/10 text-[0.875rem] font-bold text-primary">
                                {fullName[0] ?? "S"}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{fullName}</p>
                                <p className="text-xs text-muted-foreground md:hidden">{member.email ?? "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden p-4 text-sm text-muted-foreground md:table-cell">{member.email ?? "—"}</td>
                          <td className="hidden p-4 text-sm text-muted-foreground lg:table-cell">{member.phone ?? "—"}</td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={
                                member.isActive
                                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
                                  : "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"
                              }
                            >
                              {member.isActive ? t.active : t.inactive}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setEditStaff({
                                    id: member.id,
                                    firstName: member.firstName ?? "",
                                    lastName: member.lastName ?? "",
                                    email: member.email ?? "",
                                    phone: member.phone ?? "",
                                    isActive: Boolean(member.isActive),
                                  })
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {member.isActive ? (
                                <Button variant="ghost" size="icon" onClick={() => setStaffStatus.mutate({ id: member.id, isActive: false })}>
                                  <UserX className="h-4 w-4 text-destructive" />
                                </Button>
                              ) : (
                                <Button variant="ghost" size="icon" onClick={() => setStaffStatus.mutate({ id: member.id, isActive: true })}>
                                  <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => deleteStaff.mutate(member.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {!staff.length && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          {t.noStaffFound}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.addStaff}</DialogTitle>
          </DialogHeader>
          <StaffForm form={newStaff} onChange={setNewStaff} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>{t.cancel}</Button>
            <Button
              onClick={() => createStaff.mutate(newStaff)}
              disabled={createStaff.isPending || !newStaff.firstName || !newStaff.lastName || !newStaff.email}
            >
              {t.addStaff}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editStaff} onOpenChange={(open) => !open && setEditStaff(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editStaff}</DialogTitle>
          </DialogHeader>
          {editStaff && <StaffForm form={editStaff} onChange={setEditStaff} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditStaff(null)}>{t.cancel}</Button>
            <Button
              onClick={() => editStaff && updateStaff.mutate(editStaff)}
              disabled={updateStaff.isPending || !editStaff?.firstName || !editStaff?.lastName || !editStaff?.email}
            >
              {t.saveChanges}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function StaffForm<T extends StaffCreateFormState>({
  form,
  onChange,
}: {
  form: T;
  onChange: (value: T) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>{t.firstName}</Label>
          <Input value={form.firstName} onChange={(e) => onChange({ ...form, firstName: e.target.value })} />
        </div>
        <div>
          <Label>{t.lastName}</Label>
          <Input value={form.lastName} onChange={(e) => onChange({ ...form, lastName: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>{t.email}</Label>
        <Input type="email" autoComplete="off" value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} />
      </div>
      <div>
        <Label>{t.phone}</Label>
        <Input value={form.phone} onChange={(e) => onChange({ ...form, phone: e.target.value })} />
      </div>
      {"isActive" in form ? (
        <div>
          <Label>{t.status}</Label>
          <div className="mt-2 flex gap-2">
            <Button type="button" variant={form.isActive ? "default" : "outline"} onClick={() => onChange({ ...form, isActive: true } as T)}>
              {t.active}
            </Button>
            <Button type="button" variant={!form.isActive ? "default" : "outline"} onClick={() => onChange({ ...form, isActive: false } as T)}>
              {t.inactive}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
