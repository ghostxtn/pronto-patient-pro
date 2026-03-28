import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import SmartLink from "./SmartLink";
import { getLandingContent } from "./content";

export default function LandingNav() {
  const { lang } = useLanguage();
  const content = getLandingContent(lang);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
          <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="13" width="44" height="18" rx="9" fill="#65a98f" />
            <rect x="13" y="0" width="18" height="22" rx="9" fill="#4f8fe6" />
            <rect x="13" y="22" width="18" height="22" rx="9" fill="#4f8fe6" />
          </svg>
          <span className="min-w-0 hidden sm:block">
            <span className="block truncate font-display text-[1.7rem] leading-none tracking-tight text-homepage-ink">
              {content.brand.name}
            </span>
            <span className="mt-1 block truncate text-[0.68rem] uppercase tracking-[0.22em] text-homepage-soft">
              {content.brand.label}
            </span>
          </span>
        </SmartLink>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Ana menü">
          {content.navigation.map((item) => (
            <SmartLink
              key={item.href}
              href={item.href}
              className="homepage-focus rounded-full text-sm font-medium text-homepage-muted transition-colors duration-200 hover:text-homepage-ink"
            >
              {item.label}
            </SmartLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher className="h-11 w-11 rounded-full border border-homepage-border text-homepage-muted hover:border-homepage-border-strong hover:bg-homepage-shell" />

          <button
            className="lg:hidden flex items-center justify-center w-11 h-11 rounded-full border border-homepage-border text-homepage-muted hover:bg-homepage-shell transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menü"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

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

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="lg:hidden overflow-hidden border-t border-homepage-border bg-white/[0.98] backdrop-blur-md"
          >
            <div className="container flex flex-col gap-1 py-4">
              {content.navigation.map((item) => (
                <SmartLink
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-homepage-muted hover:text-homepage-ink hover:bg-homepage-shell transition-colors"
                >
                  {item.label}
                </SmartLink>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-homepage-border pt-3">
                <SmartLink
                  href="/auth"
                  onClick={() => setMenuOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-homepage-muted hover:bg-homepage-shell text-center"
                >
                  {content.auth.signInLabel}
                </SmartLink>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
