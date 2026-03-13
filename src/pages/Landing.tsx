import LandingNav from "@/components/landing/LandingNav";
import HeroSection from "@/components/landing/HeroSection";
import SpecializationsSection from "@/components/landing/SpecializationsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <LandingNav />
      <HeroSection />
      <SpecializationsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
