import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import SplitFeatureSection from "@/components/landing/SplitFeatureSection";
import SpecializationsSection from "@/components/landing/SpecializationsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import ContactBandSection from "@/components/landing/ContactBandSection";
import CTASection from "@/components/landing/CTASection";
import LandingFooter from "@/components/landing/LandingFooter";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLandingContent } from "@/components/landing/content";
import { useHomepagePreviewData } from "@/hooks/useHomepagePreviewData";

export default function Landing() {
  const { lang } = useLanguage();
  const content = getLandingContent(lang);
  const previewData = useHomepagePreviewData(lang);

  return (
    <div className="homepage-shell-gradient min-h-screen overflow-x-hidden bg-homepage-shell text-homepage-ink">
      <LandingNav />
      <HeroSection />
      {content.splitSections.map((section) => (
        <SplitFeatureSection key={section.id} {...section} />
      ))}
      <SpecializationsSection
        copy={content.doctorPreview}
        doctors={previewData.doctors}
        isLoading={previewData.isLoading}
        isError={previewData.isError}
        showEmptyState={previewData.hasLoadedEmptyDoctors}
      />
      <TestimonialsSection
        copy={content.specialtyPreview}
        specialties={previewData.specialties}
        isLoading={previewData.isLoading}
        isError={previewData.isError}
        showEmptyState={previewData.hasLoadedEmptySpecialties}
      />
      <ContactBandSection copy={content.contactBand} />
      <CTASection copy={content.faqPreview} />
      <LandingFooter />
    </div>
  );
}
