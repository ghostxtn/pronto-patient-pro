import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Edit, Loader2, Search, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import api, { request } from "@/services/api";

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

function getDoctorName(doc: any) {
  const firstName = doc.firstName ?? doc.profiles?.first_name ?? "";
  const lastName = doc.lastName ?? doc.profiles?.last_name ?? "";
  return `${firstName} ${lastName}`.trim() || "Unknown";
}

function getDoctorInitials(doc: any) {
  const name = getDoctorName(doc);
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "D"
  );
}

function getDoctorUserId(doc: any) {
  return doc.user_id ?? doc.userId ?? doc.user?.id ?? doc.profiles?.id ?? "";
}

function getDoctorAvatarUrl(doc: any, avatarOverrides: Record<string, string>) {
  const userId = getDoctorUserId(doc);
  return (
    avatarOverrides[userId] ??
    doc.avatarUrl ??
    doc.avatar_url ??
    doc.profiles?.avatarUrl ??
    doc.profiles?.avatar_url ??
    ""
  );
}

export default function ManageDoctors() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("active");
  const [editDoctor, setEditDoctor] = useState<any>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [uploadingByUserId, setUploadingByUserId] = useState<Record<string, boolean>>({});
  const [avatarOverrides, setAvatarOverrides] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const emptyNewDoctor = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    specializationId: "",
    title: "",
    bio: "",
    phone: "",
  };
  const [newDoctor, setNewDoctor] = useState(emptyNewDoctor);

  const { data: specializations } = useQuery({
    queryKey: ["specializations"],
    queryFn: async () => api.specializations.list(),
  });

  const { data: doctors } = useQuery({
    queryKey: ["admin-doctors", statusFilter],
    queryFn: async () => {
      const data = await api.doctors.list({ status: statusFilter });
      return data
        .map((doctor: any) => ({
          ...doctor,
          profiles: doctor.profiles ?? doctor.profile ?? doctor.user ?? null,
          specializations: doctor.specializations ?? doctor.specialization ?? null,
        }))
        .sort((a: any, b: any) => {
          const aDate = new Date(a.created_at ?? 0).getTime();
          const bDate = new Date(b.created_at ?? 0).getTime();
          return bDate - aDate;
        });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      request(`/doctors/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-doctors"] });
      toast.success(t.doctorStatusUpdated);
    },
  });

  const updateDoctor = useMutation({
    mutationFn: async (doc: any) =>
      request(`/doctors/${doc.id}/admin`, {
        method: "PATCH",
        body: JSON.stringify({
          firstName: doc.firstName,
          lastName: doc.lastName,
          email: doc.email,
          specializationId: doc.specializationId,
          title: doc.title,
          bio: doc.bio,
          phone: doc.phone,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-doctors"] });
      setEditDoctor(null);
      toast.success(t.doctorUpdated);
    },
  });

  const createDoctor = async () => {
    try {
      await request("/doctors/onboard", {
        method: "POST",
        body: JSON.stringify(newDoctor),
      });

      setNewDoctor(emptyNewDoctor);
      setAddOpen(false);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAvatarUpload = async (doctor: any, file?: File) => {
    if (!file) {
      return;
    }

    const userId = getDoctorUserId(doctor);
    if (!userId) {
      toast.error("Doktor kullanicisi bulunamadi");
      return;
    }

    setUploadingByUserId((current) => ({ ...current, [userId]: true }));

    try {
      const { avatarUrl } = await api.storage.uploadAvatarForUser(userId, file);

      setAvatarOverrides((current) => ({ ...current, [userId]: avatarUrl }));
      qc.setQueryData(["admin-doctors", statusFilter], (current: any[] | undefined) =>
        current?.map((item) =>
          getDoctorUserId(item) === userId
            ? {
                ...item,
                avatarUrl,
                profiles: item.profiles
                  ? {
                      ...item.profiles,
                      avatarUrl,
                      avatar_url: avatarUrl,
                    }
                  : item.profiles,
              }
            : item,
        ) ?? current,
      );

      toast.success("Doktor fotografi guncellendi");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fotograf yuklenemedi");
    } finally {
      setUploadingByUserId((current) => ({ ...current, [userId]: false }));
    }
  };

  const visibleDoctors = (doctors ?? []).filter((doc: any) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    const name = getDoctorName(doc).toLowerCase();
    const email = (doc.email ?? doc.profiles?.email ?? "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold">{t.manageDoctors}</h1>
              <p className="mt-1 text-muted-foreground">
                {doctors?.length ?? 0} {t.registeredDoctors}
              </p>
            </div>

            <button
              onClick={() => {
                setNewDoctor(emptyNewDoctor);
                setAddOpen(true);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Add Doctor
            </button>
          </div>
        </motion.div>

        <div className="mb-4 flex gap-2">
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            onClick={() => setStatusFilter("active")}
          >
            Active
          </Button>

          <Button
            variant={statusFilter === "inactive" ? "default" : "outline"}
            onClick={() => setStatusFilter("inactive")}
          >
            Inactive
          </Button>

          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
        </div>

        <motion.div custom={1} variants={fadeUp} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t.searchByNameOrEmail}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </motion.div>

        <motion.div custom={2} variants={fadeUp}>
          <Card className="shadow-card">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-4 text-sm font-medium text-muted-foreground">{t.doctor}</th>
                      <th className="hidden p-4 text-sm font-medium text-muted-foreground md:table-cell">
                        {t.specialization}
                      </th>
                      <th className="hidden p-4 text-sm font-medium text-muted-foreground lg:table-cell">
                        {t.experience}
                      </th>
                      <th className="hidden p-4 text-sm font-medium text-muted-foreground lg:table-cell">
                        {t.fee}
                      </th>
                      <th className="p-4 text-sm font-medium text-muted-foreground">{t.status}</th>
                      <th className="p-4 text-right text-sm font-medium text-muted-foreground">
                        {t.actions}
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleDoctors.map((doc: any) => {
                      const name = getDoctorName(doc);
                      const userId = getDoctorUserId(doc);
                      const avatarUrl = getDoctorAvatarUrl(doc, avatarOverrides);
                      const isUploading = !!uploadingByUserId[userId];

                      return (
                        <tr
                          key={doc.id}
                          className="border-b transition-colors last:border-0 hover:bg-muted/40"
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={name}
                                  className="h-[52px] w-[52px] rounded-full object-cover"
                                />
                              ) : (
                                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-br from-primary to-info text-sm font-bold text-primary-foreground">
                                  {getDoctorInitials(doc)}
                                </div>
                              )}

                              <div className="min-w-0">
                                <p className="font-medium text-sm">{name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.email ?? doc.profiles?.email ?? ""}
                                </p>
                                <div className="mt-2">
                                  <input
                                    ref={(node) => {
                                      fileInputRefs.current[userId] = node;
                                    }}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={(event) => {
                                      const file = event.target.files?.[0];
                                      void handleAvatarUpload(doc, file);
                                      event.target.value = "";
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isUploading || !userId}
                                    onClick={() => fileInputRefs.current[userId]?.click()}
                                  >
                                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                    Fotoğraf Yükle
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="hidden p-4 text-sm text-muted-foreground md:table-cell">
                            {doc.specialization?.name ?? doc.specializations?.name ?? "—"}
                          </td>

                          <td className="hidden p-4 text-sm text-muted-foreground lg:table-cell">
                            {doc.experience_years ?? doc.experienceYears ?? "—"}
                          </td>

                          <td className="hidden p-4 text-sm text-muted-foreground lg:table-cell">
                            {doc.consultation_fee ?? doc.consultationFee ?? "—"}
                          </td>

                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={
                                doc.is_active
                                  ? "border-success/30 bg-success/15 text-success"
                                  : "border-destructive/30 bg-destructive/15 text-destructive"
                              }
                            >
                              {doc.is_active ? t.active : t.inactive}
                            </Badge>
                          </td>

                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setEditDoctor({
                                    id: doc.id,
                                    firstName: doc.firstName ?? "",
                                    lastName: doc.lastName ?? "",
                                    email: doc.email ?? doc.profiles?.email ?? "",
                                    specializationId: doc.specializationId ?? doc.specialization_id ?? "",
                                    title: doc.title ?? "",
                                    bio: doc.bio ?? "",
                                    phone: doc.phone ?? "",
                                  })
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              {doc.is_active ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleActive.mutate({ id: doc.id, isActive: false })}
                                >
                                  <UserX className="h-4 w-4 text-destructive" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleActive.mutate({ id: doc.id, isActive: true })}
                                >
                                  <UserCheck className="h-4 w-4 text-success" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {!visibleDoctors.length && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          {t.noDoctorsFound}
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

      <Dialog open={!!editDoctor} onOpenChange={() => setEditDoctor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.editDoctor}</DialogTitle>
          </DialogHeader>

          {editDoctor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input
                    value={editDoctor.firstName ?? ""}
                    onChange={(e) => setEditDoctor({ ...editDoctor, firstName: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={editDoctor.lastName ?? ""}
                    onChange={(e) => setEditDoctor({ ...editDoctor, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editDoctor.email ?? ""}
                  onChange={(e) => setEditDoctor({ ...editDoctor, email: e.target.value })}
                />
              </div>

              <div>
                <Label>{t.specialization}</Label>
                <Select
                  value={editDoctor.specializationId ?? ""}
                  onValueChange={(value) => setEditDoctor({ ...editDoctor, specializationId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {specializations?.map((specialization: any) => (
                      <SelectItem key={specialization.id} value={specialization.id}>
                        {specialization.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={editDoctor.title ?? ""}
                  onChange={(e) => setEditDoctor({ ...editDoctor, title: e.target.value })}
                />
              </div>

              <div>
                <Label>{t.bio}</Label>
                <Textarea
                  value={editDoctor.bio ?? ""}
                  onChange={(e) => setEditDoctor({ ...editDoctor, bio: e.target.value })}
                />
              </div>

              <div>
                <Label>Phone</Label>
                <Input
                  value={editDoctor.phone ?? ""}
                  onChange={(e) => setEditDoctor({ ...editDoctor, phone: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDoctor(null)}>
              {t.cancel}
            </Button>
            <Button onClick={() => updateDoctor.mutate(editDoctor)} disabled={updateDoctor.isPending}>
              {t.saveChanges}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[420px] space-y-4 rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Add Doctor</h2>

            <input
              placeholder="First Name"
              value={newDoctor.firstName}
              onChange={(e) => setNewDoctor({ ...newDoctor, firstName: e.target.value })}
              className="w-full rounded border p-2"
            />

            <input
              placeholder="Last Name"
              value={newDoctor.lastName}
              onChange={(e) => setNewDoctor({ ...newDoctor, lastName: e.target.value })}
              className="w-full rounded border p-2"
            />

            <input
              placeholder="Email"
              value={newDoctor.email}
              onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
              className="w-full rounded border p-2"
            />

            <input
              placeholder="Password"
              type="password"
              value={newDoctor.password}
              onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
              className="w-full rounded border p-2"
            />

            <select
              value={newDoctor.specializationId}
              onChange={(e) => setNewDoctor({ ...newDoctor, specializationId: e.target.value })}
              className="w-full rounded border p-2"
            >
              <option value="">Select Specialization</option>
              {specializations?.map((specialization: any) => (
                <option key={specialization.id} value={specialization.id}>
                  {specialization.name}
                </option>
              ))}
            </select>

            <input
              placeholder="Title"
              value={newDoctor.title}
              onChange={(e) => setNewDoctor({ ...newDoctor, title: e.target.value })}
              className="w-full rounded border p-2"
            />

            <textarea
              placeholder="Bio"
              value={newDoctor.bio}
              onChange={(e) => setNewDoctor({ ...newDoctor, bio: e.target.value })}
              className="w-full rounded border p-2"
            />

            <input
              placeholder="Phone"
              value={newDoctor.phone}
              onChange={(e) => setNewDoctor({ ...newDoctor, phone: e.target.value })}
              className="w-full rounded border p-2"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setAddOpen(false)} className="rounded border px-3 py-2">
                Cancel
              </button>
              <button onClick={createDoctor} className="rounded bg-blue-600 px-4 py-2 text-white">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
