import { motion } from "framer-motion";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import HeroSection from "@/components/landing/HeroSection";
import SpecialtiesSection from "@/components/landing/SpecializationsSection";
import DoctorsSection from "@/components/landing/DoctorsSection";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLandingContent } from "@/components/landing/content";
import { useHomepagePreviewData } from "@/hooks/useHomepagePreviewData";

const placeholderDoctors = [
  { id: "placeholder-1", name: "Dr. Elif Kaya", title: "Kardiyoloji" },
  { id: "placeholder-2", name: "Dr. Mert Demir", title: "Dahiliye" },
  { id: "placeholder-3", name: "Dr. Zeynep Akın", title: "Dermatoloji" },
];

export default function Landing() {
  const { lang } = useLanguage();
  const content = getLandingContent(lang);
  const previewData = useHomepagePreviewData(lang);

  void content;

  const heroDoctors = previewData.doctors.length
    ? previewData.doctors.slice(0, 3).map((doctor) => ({
        id: doctor.id,
        name: doctor.name,
        title: doctor.specialtyName || doctor.title || "",
      }))
    : placeholderDoctors;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen overflow-x-hidden bg-[#f4f8fd] text-[#1a2e3b]"
    >
      <LandingNav />
      <HeroSection doctors={heroDoctors} />
      <SpecialtiesSection
        specialties={previewData.specialties.map((specialty) => ({
          id: specialty.id,
          name: specialty.name,
        }))}
        isLoading={previewData.isLoading}
        hasLoadedEmpty={previewData.hasLoadedEmptySpecialties}
      />
      <DoctorsSection
        doctors={previewData.doctors.map((doctor) => ({
          id: doctor.id,
          name: doctor.name,
          specialtyName: doctor.specialtyName,
          title: doctor.title,
        }))}
        isLoading={previewData.isLoading}
        hasLoadedEmpty={previewData.hasLoadedEmptyDoctors}
      />
      <LandingFooter />
    </motion.div>
  );
}
