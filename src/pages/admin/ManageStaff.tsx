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

function humanizeError(err: any): string {
  const raw = err?.response?.data?.message ?? err?.message;
  const messages = Array.isArray(raw) ? raw : raw ? [raw] : [];

  const map: Record<string, string> = {
    "firstName should not be empty": "Ad boş bırakılamaz",
    "lastName should not be empty": "Soyad boş bırakılamaz",
    "email must be an email": "Geçerli bir e-posta adresi girin",
    "email should not be empty": "E-posta boş bırakılamaz",
    "password must be longer than or equal to 6 characters":
      "Şifre en az 6 karakter olmalıdır",
    "password should not be empty": "Şifre boş bırakılamaz",
    "specializationId should not be empty": "Uzmanlık alanı seçiniz",
    "specializationId must be a UUID": "Uzmanlık alanı seçiniz",
    "title should not be empty": "Unvan boş bırakılamaz",
    "bio should not be empty": "Biyografi boş bırakılamaz",
    "phone should not be empty": "Telefon boş bırakılamaz",
    "role should not be empty": "Rol seçiniz",
    "Email already exists": "Bu e-posta adresi zaten kullanılıyor",
  };

  const first = messages[0];
  if (!first) return "Bir hata oluştu. Lütfen tekrar deneyin.";
  return map[first] ?? first;
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
        const { isActive: _removed, ...createPayload } = payload as StaffCreateFormState & {
          isActive?: boolean;
        };
        return await api.staff.create(createPayload);
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
              <h1
                className="text-3xl font-display font-bold"
                style={{ color: "#1a2e3b", fontFamily: "Manrope, sans-serif", fontWeight: 700 }}
              >
                {t.manageStaff}
              </h1>
              <p className="text-muted-foreground mt-1" style={{ color: "#5a7a8a" }}>{staff.length} {t.registeredStaff}</p>
            </div>
            <button
              onClick={() => { setNewStaff(emptyStaffForm); setAddOpen(true); }}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors"
              style={{ background: "#4f8fe6" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#2f75ca"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#4f8fe6"}
            >
              <UserPlus className="h-4 w-4" />
              {t.addStaff}
            </button>
          </div>
        </motion.div>

        <motion.div custom={1} variants={fadeUp} className="flex gap-2 mb-4">
          {(["active", "inactive", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              style={{
                background: statusFilter === f ? "#4f8fe6" : "white",
                color: statusFilter === f ? "white" : "#5a7a8a",
                border: `1.5px solid ${statusFilter === f ? "#4f8fe6" : "#b5d1cc"}`,
                borderRadius: "10px",
                padding: "6px 18px",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {f === "active" ? t.active : f === "inactive" ? t.inactive : t.all}
            </button>
          ))}
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
          <Card
            style={{
              background: "white",
              border: "1px solid #b5d1cc",
              borderRadius: "16px",
              boxShadow: "0 2px 12px rgba(79,143,230,0.08)",
              overflow: "visible",
            }}
          >
            <CardContent className="p-0">
              <div className="overflow-x-auto overflow-y-auto max-h-[560px]">
                <table className="w-full">
                  <thead>
                    <tr className="text-left" style={{ background: "#f4f8fd", borderBottom: "1px solid #b5d1cc" }}>
                      <th className="p-4 text-sm font-medium text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.8rem", fontWeight: 600, padding: "12px 16px" }}>{t.name}</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden md:table-cell" style={{ color: "#5a7a8a", fontSize: "0.8rem", fontWeight: 600, padding: "12px 16px" }}>{t.email}</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell" style={{ color: "#5a7a8a", fontSize: "0.8rem", fontWeight: 600, padding: "12px 16px" }}>{t.phone}</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground" style={{ color: "#5a7a8a", fontSize: "0.8rem", fontWeight: 600, padding: "12px 16px" }}>{t.status}</th>
                      <th className="p-4 text-sm font-medium text-muted-foreground text-right" style={{ color: "#5a7a8a", fontSize: "0.8rem", fontWeight: 600, padding: "12px 16px" }}>{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((member: any) => {
                      const fullName = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || "Unknown";
                      return (
                        <tr
                          key={member.id}
                          className="last:border-0 transition-colors"
                          style={{ borderBottom: "1px solid #f0f4f8" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#f4f8fd"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "white"}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: "10px",
                                background: "#eaf5ff",
                                color: "#4f8fe6",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.875rem",
                                fontWeight: 700,
                                border: "2px solid #b5d1cc",
                                flexShrink: 0,
                              }}>
                                {fullName[0] ?? "S"}
                              </div>
                              <div>
                                <p className="font-medium text-sm" style={{ color: "#1a2e3b", fontWeight: 600, fontSize: "0.9rem" }}>{fullName}</p>
                                <p className="text-xs text-muted-foreground md:hidden" style={{ color: "#5a7a8a", fontSize: "0.78rem" }}>{member.email ?? "—"}</p>
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
                                  ? "border-[#b5d1cc] bg-[#e6f4ef] text-[#65a98f]"
                                  : "border-[#fca5a5]/30 bg-[#fef2f2] text-[#e05252]"
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
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setStaffStatus.mutate({ id: member.id, isActive: false })}
                                >
                                  <UserX className="h-4 w-4 text-destructive" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setStaffStatus.mutate({ id: member.id, isActive: true })}
                                >
                                  <UserCheck className="h-4 w-4 text-success" />
                                </Button>
                              )}
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
        <Input
          type="email"
          autoComplete="off"
          value={form.email}
          onChange={(e) => onChange({ ...form, email: e.target.value })}
        />
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
