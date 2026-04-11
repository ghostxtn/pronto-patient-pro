import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHomepagePreviewData } from "@/hooks/useHomepagePreviewData";
import SmartLink from "./SmartLink";

export default function LandingNav() {
  const { user, logout } = useAuth();
  const { lang, t } = useLanguage();
  const previewData = useHomepagePreviewData(lang);
  const clinic = (previewData.data as { clinic?: { name?: string | null; logo_url?: string | null; updated_at?: string | null } | null } | undefined)?.clinic;
  const logoUrl = clinic?.logo_url
    ? `${clinic.logo_url}?t=${new Date(clinic.updated_at ?? Date.now()).getTime()}`
    : null;
  const clinicName = clinic?.name ?? "MediBook";
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navigationItems = useMemo(
    () => [
      { href: "/specialties", label: t.specializations },
      { href: "/doctors", label: t.doctors },
      { href: "/appointment-process", label: t.appointmentProcessTitle },
      { href: "/contact", label: t.contact },
    ],
    [t],
  );

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
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={clinicName}
              style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }}
            />
          ) : (
            <svg width="36" height="36" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="13" width="44" height="18" rx="9" fill="#65a98f" />
              <rect x="13" y="0" width="18" height="22" rx="9" fill="#4f8fe6" />
              <rect x="13" y="22" width="18" height="22" rx="9" fill="#4f8fe6" />
            </svg>
          )}
          <span className="min-w-0 hidden sm:block">
            <span className="block truncate font-display text-[1.7rem] leading-none tracking-tight text-homepage-ink">
              {clinicName}
            </span>
            <span className="mt-1 block truncate text-[0.68rem] uppercase tracking-[0.22em] text-homepage-soft">
              {t.brandLabel}
            </span>
          </span>
        </SmartLink>

        <nav className="hidden items-center gap-7 lg:flex" aria-label={t.mainNavigation}>
          {navigationItems.map((item) => (
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
            className="flex h-11 w-11 items-center justify-center rounded-full border border-homepage-border text-homepage-muted transition-colors hover:bg-homepage-shell lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t.menu}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <SmartLink
                href={
                  user.role === "admin" || user.role === "owner"
                    ? "/admin/dashboard"
                    : user.role === "doctor"
                      ? "/doctor/dashboard"
                      : user.role === "staff"
                        ? "/staff/dashboard"
                        : "/patient/dashboard"
                }
                className="flex items-center gap-2 rounded-full border border-homepage-border px-4 py-2 text-sm font-medium text-homepage-ink transition-colors hover:bg-homepage-shell"
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "#eaf5ff",
                    border: "1.5px solid #b5d1cc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#4f8fe6",
                    flexShrink: 0,
                  }}
                >
                  {user.email?.[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="max-w-[140px] truncate text-sm">{user.email}</span>
              </SmartLink>
              <button
                onClick={logout}
                className="rounded-full border border-homepage-border px-4 py-2 text-sm font-medium text-homepage-muted transition-colors hover:bg-homepage-shell hover:text-homepage-ink"
              >
                {t.logoutLabel}
              </button>
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                asChild
                className="homepage-focus hidden rounded-full px-5 text-sm font-medium text-homepage-muted hover:bg-homepage-shell hover:text-homepage-ink md:inline-flex"
              >
                <SmartLink href="/auth">{t.signIn}</SmartLink>
              </Button>

              <Button
                asChild
                className="homepage-focus rounded-full border border-homepage-brand bg-homepage-brand px-5 text-sm font-medium text-white hover:bg-homepage-brand-deep"
              >
                <SmartLink href="/request-appointment">{t.appointmentRequest}</SmartLink>
              </Button>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden border-t border-homepage-border bg-white/[0.98] backdrop-blur-md lg:hidden"
          >
            <div className="container flex flex-col gap-1 py-4">
              {navigationItems.map((item) => (
                <SmartLink
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-homepage-muted transition-colors hover:bg-homepage-shell hover:text-homepage-ink"
                >
                  {item.label}
                </SmartLink>
              ))}

              <div className="mt-3 flex flex-col gap-2 border-t border-homepage-border pt-3">
                {user ? (
                  <>
                    <SmartLink
                      href={
                        user.role === "admin" || user.role === "owner"
                          ? "/admin/dashboard"
                          : user.role === "doctor"
                            ? "/doctor/dashboard"
                            : user.role === "staff"
                              ? "/staff/dashboard"
                              : "/patient/dashboard"
                      }
                      onClick={() => setMenuOpen(false)}
                      className="rounded-xl px-4 py-3 text-center text-sm font-medium text-homepage-ink hover:bg-homepage-shell"
                    >
                      {t.myDashboard}
                    </SmartLink>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="rounded-xl px-4 py-3 text-center text-sm font-medium text-homepage-muted hover:bg-homepage-shell"
                    >
                      {t.logoutLabel}
                    </button>
                  </>
                ) : (
                  <SmartLink
                    href="/auth"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-center text-sm font-medium text-homepage-muted hover:bg-homepage-shell"
                  >
                    {t.signIn}
                  </SmartLink>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
