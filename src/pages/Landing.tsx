import { motion } from "framer-motion";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";
import HeroSection from "@/components/landing/HeroSection";
import SpecialtiesSection from "@/components/landing/SpecializationsSection";
import DoctorsSection from "@/components/landing/DoctorsSection";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHomepagePreviewData } from "@/hooks/useHomepagePreviewData";

export default function Landing() {
  const { lang } = useLanguage();
  const previewData = useHomepagePreviewData(lang);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen [overflow-x:clip] bg-[#f4f8fd] text-[#1a2e3b]"
    >
      <LandingNav />
      <HeroSection />
      <div
        style={{
          position: "relative",
          zIndex: 10,
          background: "#f4f8fd",
          borderRadius: "48px 48px 0 0",
          marginTop: "-75vh",
          overflow: "visible",
        }}
      >
        <SpecialtiesSection
          specialties={previewData.specialties.map((specialty) => ({
            id: specialty.id,
            name: specialty.name,
            description: specialty.description,
            slug: specialty.slug,
            imageSrc: specialty.imageSrc,
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
            imageSrc: doctor.imageSrc,
          }))}
          isLoading={previewData.isLoading}
          hasLoadedEmpty={previewData.hasLoadedEmptyDoctors}
        />
        <LandingFooter />
      </div>
    </motion.div>
  );
}
