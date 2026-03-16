import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import QuickAccessSection from "@/components/landing/QuickAccessSection";
import SpecializationsSection from "@/components/landing/SpecializationsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import LandingFooter from "@/components/landing/LandingFooter";
import SplitFeatureSection from "@/components/landing/SplitFeatureSection";
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
      <QuickAccessSection />
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
      <CTASection copy={content.faqPreview} />
      <LandingFooter />
    </div>
  );
}
