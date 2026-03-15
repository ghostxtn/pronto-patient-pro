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
import api from "@/services/api";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

type StaffFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
};

const emptyStaffForm: StaffFormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  isActive: true,
};

export default function ManageStaff() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");
  const [addOpen, setAddOpen] = useState(false);
  const [newStaff, setNewStaff] = useState<StaffFormState>(emptyStaffForm);
  const [editStaff, setEditStaff] = useState<(StaffFormState & { id: string }) | null>(null);

  const { data: staff = [] } = useQuery({
    queryKey: ["admin-staff", search, statusFilter],
    queryFn: () => api.staff.list({ search, status: statusFilter }),
  });

  const createStaff = useMutation({
    mutationFn: (payload: StaffFormState) => api.staff.create(payload),
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
    mutationFn: (payload: StaffFormState & { id: string }) => api.staff.update(payload.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
      setEditStaff(null);
      toast.success(t.staffUpdated);
    },
  });

  const setStaffStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.staff.setStatus(id, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-staff"] });
      toast.success(t.staffStatusUpdated);
    },
  });

  const deleteStaff = useMutation({
    mutationFn: (id: string) => api.staff.delete(id),
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
              <h1 className="text-3xl font-display font-bold">{t.manageStaff}</h1>
              <p className="text-muted-foreground mt-1">{staff.length} {t.registeredStaff}</p>
            </div>
            <Button onClick={() => { setNewStaff(emptyStaffForm); setAddOpen(true); }}>
              <UserPlus className="h-4 w-4 mr-2" />
              {t.addStaff}
            </Button>
          </div>
        </motion.div>

        <motion.div custom={1} variants={fadeUp} className="flex gap-2 mb-4">
          <Button variant={statusFilter === "active" ? "default" : "outline"} onClick={() => setStatusFilter("active")}>
            {t.active}
          </Button>
          <Button variant={statusFilter === "inactive" ? "default" : "outline"} onClick={() => setStatusFilter("inactive")}>
            {t.inactive}
          </Button>
          <Button variant={statusFilter === "all" ? "default" : "outline"} onClick={() => setStatusFilter("all")}>
            {t.all}
          </Button>
        </motion.div>

        <motion.div custom={2} variants={fadeUp} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.searchByNameOrEmail}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </motion.div>

        <motion.div custom={3} variants={fadeUp}>
          <Card className="shadow-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-4 text-sm font-medium text-muted-foreground">{t.name}</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">{t.email}</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">{t.phone}</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">{t.status}</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground text-right">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((member: any) => {
                      const fullName = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || "Unknown";
                      return (
                        <tr key={member.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-primary-foreground font-bold text-sm">
                                {fullName[0] ?? "S"}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{fullName}</p>
                                <p className="text-xs text-muted-foreground md:hidden">{member.email ?? "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 hidden md:table-cell text-sm text-muted-foreground">{member.email ?? "—"}</td>
                          <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">{member.phone ?? "—"}</td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={
                                member.isActive
                                  ? "bg-success/15 text-success border-success/30"
                                  : "bg-destructive/15 text-destructive border-destructive/30"
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setStaffStatus.mutate({ id: member.id, isActive: true })}
                                disabled={Boolean(member.isActive)}
                              >
                                <UserCheck className="h-4 w-4 text-success" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setStaffStatus.mutate({ id: member.id, isActive: false })}
                                disabled={!member.isActive}
                              >
                                <UserX className="h-4 w-4 text-destructive" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteStaff.mutate(member.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!staff.length && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">{t.noStaffFound}</td>
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

function StaffForm<T extends StaffFormState>({
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
        <Input type="email" value={form.email} onChange={(e) => onChange({ ...form, email: e.target.value })} />
      </div>
      <div>
        <Label>{t.phone}</Label>
        <Input value={form.phone} onChange={(e) => onChange({ ...form, phone: e.target.value })} />
      </div>
      <div>
        <Label>{t.status}</Label>
        <div className="mt-2 flex gap-2">
          <Button type="button" variant={form.isActive ? "default" : "outline"} onClick={() => onChange({ ...form, isActive: true })}>
            {t.active}
          </Button>
          <Button type="button" variant={!form.isActive ? "default" : "outline"} onClick={() => onChange({ ...form, isActive: false })}>
            {t.inactive}
          </Button>
        </div>
      </div>
    </div>
  );
}
