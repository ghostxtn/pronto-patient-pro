import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Stethoscope, HeartPulse, Brain, Eye, Baby, Bone, ScanFace, Smile,
  Search, Star, ArrowRight,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  stethoscope: Stethoscope, "heart-pulse": HeartPulse, brain: Brain,
  eye: Eye, baby: Baby, bone: Bone, "scan-face": ScanFace, smile: Smile,
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function FindDoctors() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);
  const { t } = useLanguage();

  const { data: specializations } = useQuery({
    queryKey: ["specializations"],
    queryFn: async () => api.specializations.list(),
  });

  const { data: doctors, isLoading } = useQuery({
    queryKey: ["doctors", selectedSpec, searchQuery],
    queryFn: async () => api.doctors.list(selectedSpec ? { specialization_id: selectedSpec } : undefined),
  });

  const filteredDoctors = (doctors ?? []).filter((doctor: any) => {
    const doctorName = [doctor.firstName, doctor.lastName].filter(Boolean).join(" ").trim().toLowerCase();
    const specializationName = doctor.specialization?.name?.toLowerCase() ?? "";
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return doctorName.includes(query) || specializationName.includes(query);
  });

  return (
    <AppLayout>
      <motion.div initial="hidden" animate="visible">
        <motion.div className="mb-8" custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-display font-bold mb-2">{t.findDoctorTitle}</h1>
          <p className="text-muted-foreground">{t.findDoctorDesc}</p>
        </motion.div>

        <motion.div className="mb-6" custom={1} variants={fadeUp}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t.searchByNameOrSpecialty} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 rounded-xl" />
          </div>
        </motion.div>

        <motion.div className="flex flex-wrap gap-2 mb-8" custom={2} variants={fadeUp}>
          <Button variant={selectedSpec === null ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setSelectedSpec(null)}>{t.all}</Button>
          {specializations?.map((spec) => {
            const Icon = iconMap[(spec as any).icon || ""] || Stethoscope;
            return (
              <Button key={spec.id} variant={selectedSpec === spec.id ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setSelectedSpec(spec.id)}>
                <Icon className="h-3.5 w-3.5 mr-1" /> {spec.name}
              </Button>
            );
          })}
        </motion.div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-2xl p-6 shadow-card animate-pulse">
                <div className="flex items-center gap-4 mb-4"><div className="h-14 w-14 rounded-2xl bg-muted" /><div className="space-y-2 flex-1"><div className="h-4 bg-muted rounded w-2/3" /><div className="h-3 bg-muted rounded w-1/2" /></div></div>
                <div className="h-3 bg-muted rounded w-full mb-2" /><div className="h-3 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredDoctors && filteredDoctors.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDoctors.map((doctor, i) => {
              const doctorName =
                [doctor.firstName, doctor.lastName].filter(Boolean).join(" ").trim() ||
                "Unknown";
              const doctorInitial = doctorName[0] || "D";
              const spec = (doctor as any).specialization as any;
              const Icon = iconMap[spec?.icon || ""] || Stethoscope;
              return (
                <motion.div key={doctor.id} className="glass rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1" custom={i + 3} variants={fadeUp}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-info flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-foreground font-display font-bold text-lg">{doctorInitial}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display font-semibold truncate">Dr. {doctorName}</h3>
                      <Badge variant="secondary" className="mt-1 text-xs rounded-full"><Icon className="h-3 w-3 mr-1" />{spec?.name || "General"}</Badge>
                    </div>
                  </div>
                  {doctor.bio && <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{doctor.bio}</p>}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    {doctor.phone ? <span>{doctor.phone}</span> : null}
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-warning text-warning" />4.8</span>
                  </div>
                  <Button asChild className="w-full rounded-xl shadow-soft">
                    <Link to={`/doctors/${doctor.id}`}>{t.bookAppointment} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div className="glass rounded-2xl p-12 shadow-card text-center" custom={3} variants={fadeUp}>
            <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg mb-2">{t.noDoctorsFound}</h3>
            <p className="text-muted-foreground text-sm">{searchQuery ? t.noSearchResults : t.noSpecDoctors}</p>
          </motion.div>
        )}
      </motion.div>
    </AppLayout>
  );
}
