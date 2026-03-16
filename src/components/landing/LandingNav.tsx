import { useEffect, useState } from "react";
import { Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import SmartLink from "./SmartLink";
import { getLandingContent } from "./content";

export default function LandingNav() {
  const { lang } = useLanguage();
  const content = getLandingContent(lang);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 border-b transition-all duration-300",
        isScrolled
          ? "border-homepage-border-strong/90 bg-white/[0.96] backdrop-blur-md"
          : "border-transparent bg-white/[0.78] backdrop-blur-sm",
      ].join(" ")}
    >
      <div className="container flex h-20 items-center justify-between gap-4">
        <SmartLink href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-homepage-border bg-homepage-brand-deep text-white">
            <Stethoscope className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-display text-[1.7rem] leading-none tracking-tight text-homepage-ink">
              {content.brand.name}
            </span>
            <span className="mt-1 block truncate text-[0.68rem] uppercase tracking-[0.22em] text-homepage-soft">
              {content.brand.label}
            </span>
          </span>
        </SmartLink>

        <nav className="hidden items-center gap-7 lg:flex">
          {content.navigation.map((item) => {
            const href =
              item.href === "#specialties-preview" ||
              item.label === "Uzmanlik Alanlari" ||
              item.label === "UzmanlÄ±k AlanlarÄ±" ||
              item.label === "Specialties"
                ? "/specialties"
                : item.href;

            return (
              <SmartLink
                key={`${item.label}-${href}`}
                href={href}
              className="homepage-focus rounded-full text-sm font-medium text-homepage-muted transition-colors duration-200 hover:text-homepage-ink"
              >
                {item.label}
              </SmartLink>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher className="h-11 w-11 rounded-full border border-homepage-border text-homepage-muted hover:border-homepage-border-strong hover:bg-homepage-shell" />

          <Button
            variant="ghost"
            asChild
            className="homepage-focus hidden rounded-full px-5 text-sm font-medium text-homepage-muted hover:bg-homepage-shell hover:text-homepage-ink md:inline-flex"
          >
            <SmartLink href="/auth">{content.auth.signInLabel}</SmartLink>
          </Button>

          <Button
            asChild
            className="homepage-focus rounded-full border border-homepage-brand bg-homepage-brand px-5 text-sm font-medium text-white hover:bg-homepage-brand-deep"
          >
            <SmartLink href="/request-appointment">{content.auth.requestLabel}</SmartLink>
          </Button>
        </div>
      </div>
    </header>
  );
}
