import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { request } from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Search, Edit, UserCheck, UserX } from "lucide-react";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }) };

export default function ManageDoctors() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [editDoctor, setEditDoctor] = useState<any>(null);
  const [addOpen, setAddOpen] = useState(false);
  const emptyNewDoctor = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    specializationId: "",
    title: "",
    bio: "",
    phone: ""
  };
  const [newDoctor, setNewDoctor] = useState(emptyNewDoctor);

  const { data: specializations } = useQuery({ queryKey: ["specializations"], queryFn: async () => api.specializations.list() });
  const { data: doctors } = useQuery({
    queryKey: ["admin-doctors"],
    queryFn: async () => {
      const data = await api.doctors.list();
      return data
        .map((doctor: any) => ({
          ...doctor,
          profiles:
            doctor.profiles ??
            doctor.profile ??
            doctor.user ??
            null,
          specializations:
            doctor.specializations ??
            doctor.specialization ??
            null,
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-doctors"] }); toast.success(t.doctorStatusUpdated); }
  });
  const deleteDoctor = useMutation({ mutationFn: async (id: string) => api.doctors.delete(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-doctors"] }); } });
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-doctors"] }); setEditDoctor(null); toast.success(t.doctorUpdated); }
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

  const visibleDoctors = (doctors ?? []).filter((doc: any) => {
    if (statusFilter === "active") return doc.is_active === true;
    if (statusFilter === "inactive") return doc.is_active === false;
    return true;
  });

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible" className="space-y-6">
        <motion.div custom={0} variants={fadeUp}><div className="flex items-start justify-between gap-4"><div><h1 className="text-3xl font-display font-bold">{t.manageDoctors}</h1><p className="text-muted-foreground mt-1">{doctors?.length ?? 0} {t.registeredDoctors}</p></div><button
  onClick={() => { setNewDoctor(emptyNewDoctor); setAddOpen(true); }}
  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
>
Add Doctor
</button></div></motion.div>
        <div className="flex gap-2 mb-4">
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
        <motion.div custom={1} variants={fadeUp} className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t.searchByNameOrEmail} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></motion.div>
        <motion.div custom={2} variants={fadeUp}>
          <Card className="shadow-card"><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b text-left"><th className="p-4 text-sm font-medium text-muted-foreground">{t.doctor}</th><th className="p-4 text-sm font-medium text-muted-foreground hidden md:table-cell">{t.specialization}</th><th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">{t.experience}</th><th className="p-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">{t.fee}</th><th className="p-4 text-sm font-medium text-muted-foreground">{t.status}</th><th className="p-4 text-sm font-medium text-muted-foreground text-right">{t.actions}</th></tr></thead>
          <tbody>
            {visibleDoctors.map((doc: any) => {
              const name =
                doc.firstName && doc.lastName
                  ? `${doc.firstName} ${doc.lastName}`
                  : "Unknown";

              return (
                <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-info flex items-center justify-center text-primary-foreground font-bold text-sm">
                        {name[0] ?? "D"}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{name}</p>
                        <p className="text-xs text-muted-foreground">{doc.email ?? doc.profiles?.email ?? ""}</p>
                      </div>
                    </div>
                  </td>

                  <td className="p-4">
                    <Badge
                      variant="outline"
                      className={
                        doc.is_active
                          ? "bg-success/15 text-success border-success/30"
                          : "bg-destructive/15 text-destructive border-destructive/30"
                      }
                    >
                      {doc.is_active ? t.active : t.inactive}
                    </Badge>
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditDoctor({
                        id: doc.id,
                        firstName: doc.firstName ?? "",
                        lastName: doc.lastName ?? "",
                        email: doc.email ?? doc.profiles?.email ?? "",
                        specializationId: doc.specializationId ?? doc.specialization_id ?? "",
                        title: doc.title ?? "",
                        bio: doc.bio ?? "",
                        phone: doc.phone ?? "",
                      })}>
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button variant="ghost" size="icon" onClick={() => toggleActive.mutate({ id: doc.id, isActive: true })}>
                        <UserCheck className="h-4 w-4 text-success" />
                      </Button>

                      <Button variant="ghost" size="icon" onClick={() => toggleActive.mutate({ id: doc.id, isActive: false })}>
                        <UserX className="h-4 w-4 text-destructive" />
                      </Button>

                    </div>
                  </td>
                </tr>
              );
            })}

            {!visibleDoctors.length && (
              <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">{t.noDoctorsFound}</td></tr>
            )}
          </tbody></table></div></CardContent></Card>
        </motion.div>
      </motion.div>

      <Dialog open={!!editDoctor} onOpenChange={() => setEditDoctor(null)}>
        <DialogContent><DialogHeader><DialogTitle>{t.editDoctor}</DialogTitle></DialogHeader>
          {editDoctor && (<div className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><Label>First Name</Label><Input value={editDoctor.firstName ?? ""} onChange={(e) => setEditDoctor({ ...editDoctor, firstName: e.target.value })} /></div><div><Label>Last Name</Label><Input value={editDoctor.lastName ?? ""} onChange={(e) => setEditDoctor({ ...editDoctor, lastName: e.target.value })} /></div></div><div><Label>Email</Label><Input type="email" value={editDoctor.email ?? ""} onChange={(e) => setEditDoctor({ ...editDoctor, email: e.target.value })} /></div><div><Label>{t.specialization}</Label><Select value={editDoctor.specializationId ?? ""} onValueChange={(v) => setEditDoctor({ ...editDoctor, specializationId: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{specializations?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div><div><Label>Title</Label><Input value={editDoctor.title ?? ""} onChange={(e) => setEditDoctor({ ...editDoctor, title: e.target.value })} /></div><div><Label>{t.bio}</Label><Textarea value={editDoctor.bio ?? ""} onChange={(e) => setEditDoctor({ ...editDoctor, bio: e.target.value })} /></div><div><Label>Phone</Label><Input value={editDoctor.phone ?? ""} onChange={(e) => setEditDoctor({ ...editDoctor, phone: e.target.value })} /></div></div>)}
          <DialogFooter><Button variant="outline" onClick={() => setEditDoctor(null)}>{t.cancel}</Button><Button onClick={() => updateDoctor.mutate(editDoctor)} disabled={updateDoctor.isPending}>{t.saveChanges}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {addOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">

          <div className="w-[420px] rounded-xl bg-white p-6 space-y-4 shadow-xl">

            <h2 className="text-lg font-semibold">
              Add Doctor
            </h2>

            <input
              placeholder="First Name"
              value={newDoctor.firstName}
              onChange={(e) =>
                setNewDoctor({ ...newDoctor, firstName: e.target.value })
              }
              className="w-full border rounded p-2"
            />

            <input
              placeholder="Last Name"
              value={newDoctor.lastName}
              onChange={(e) =>
                setNewDoctor({ ...newDoctor, lastName: e.target.value })
              }
              className="w-full border rounded p-2"
            />

            <input
              type="email"
              name="new-doctor-email"
              autoComplete="off"
              placeholder="Email"
              value={newDoctor.email}
              onChange={(e) =>
              setNewDoctor({ ...newDoctor, email: e.target.value })
              }
              className="w-full border rounded p-2"
            />

            <input
            type="password"
            name="new-doctor-password"
            autoComplete="new-password"
            placeholder="Password"
            value={newDoctor.password}
            onChange={(e) =>
            setNewDoctor({ ...newDoctor, password: e.target.value })
            }
            className="w-full border rounded p-2"
            />

            <select
              value={newDoctor.specializationId}
              onChange={(e) =>
                setNewDoctor({ ...newDoctor, specializationId: e.target.value })
              }
              className="w-full border rounded p-2"
            >
              <option value="">Select specialization</option>
              {specializations?.map((specialization: any) => (
                <option key={specialization.id} value={specialization.id}>
                  {specialization.name}
                </option>
              ))}
            </select>

            <input
              placeholder="Title"
              value={newDoctor.title}
              onChange={(e) =>
                setNewDoctor({ ...newDoctor, title: e.target.value })
              }
              className="w-full border rounded p-2"
            />

            <input
              placeholder="Phone"
              value={newDoctor.phone}
              onChange={(e) =>
                setNewDoctor({ ...newDoctor, phone: e.target.value })
              }
              className="w-full border rounded p-2"
            />

            <textarea
              placeholder="Bio"
              value={newDoctor.bio}
              onChange={(e) =>
                setNewDoctor({ ...newDoctor, bio: e.target.value })
              }
              className="w-full border rounded p-2"
            />

            <div className="flex justify-end gap-2">

              <button
                onClick={() => { setNewDoctor(emptyNewDoctor); setAddOpen(false); }}
                className="px-4 py-2 border rounded"
              >
Cancel
              </button>

              <button
                onClick={createDoctor}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
Create
              </button>

            </div>

          </div>
        </div>
      )}
    </AppLayout>
  );
}
