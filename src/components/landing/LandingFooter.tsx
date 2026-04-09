import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import SmartLink from "./SmartLink";

export default function LandingFooter() {
  const { t } = useLanguage();

  const footerColumns = useMemo(
    () => [
      {
        title: t.footerClinicTitle,
        links: [
          { label: t.aboutUs, href: "/about" },
          { label: t.doctors, href: "/doctors" },
          { label: t.specializations, href: "/specialties" },
          { label: t.contact, href: "/contact" },
        ],
      },
      {
        title: t.footerPatientResourcesTitle,
        links: [
          { label: t.appointmentProcessTitle, href: "/appointment-process" },
          { label: t.faq, href: "/faq" },
          { label: t.medicalInformation, href: "/legal/medical-disclaimer" },
          { label: t.accessibility, href: "/accessibility" },
        ],
      },
      {
        title: t.footerLegalTitle,
        links: [
          { label: t.privacyNoticeKvkk, href: "/legal/kvkk" },
          { label: t.privacy, href: "/legal/privacy-policy" },
          { label: t.cookiePolicy, href: "/legal/cookie-policy" },
          { label: t.dataSubjectRequest, href: "/legal/data-subject-application" },
        ],
      },
    ],
    [t],
  );

  const bottomLinks = useMemo(
    () => [
      { label: t.privacy, href: "/legal/privacy-policy" },
      { label: t.terms, href: "/legal/terms-of-use" },
      { label: t.contact, href: "/contact" },
    ],
    [t],
  );

  return (
    <footer
      id="footer"
      className="mt-0 pb-10 pt-12 md:pb-12 md:pt-16"
      style={{
        background:
          "linear-gradient(145deg, hsl(var(--homepage-footer-bg-from)) 0%, hsl(var(--homepage-footer-bg-mid)) 40%, hsl(var(--homepage-footer-bg-to)) 100%)",
        color: "hsl(var(--homepage-footer-text))",
      }}
    >
      <div className="container">
        <div
          className="grid gap-10 pb-10 lg:grid-cols-[0.9fr_1.1fr]"
          style={{ borderBottom: "1px solid hsl(var(--homepage-footer-text) / 0.1)" }}
        >
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <svg width="38" height="38" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="13" width="44" height="18" rx="9" fill="rgb(var(--homepage-support))" />
                <rect x="13" y="0" width="18" height="22" rx="9" fill="rgb(var(--homepage-brand))" />
                <rect x="13" y="22" width="18" height="22" rx="9" fill="rgb(var(--homepage-brand))" />
              </svg>
              <div>
                <p
                  className="font-display text-[1.8rem] leading-none tracking-tight"
                  style={{ color: "hsl(var(--homepage-footer-text))" }}
                >
                  MediBook
                </p>
                <p
                  className="mt-1 text-xs uppercase tracking-[0.22em]"
                  style={{ color: "hsl(var(--homepage-footer-text) / 0.6)" }}
                >
                  {t.brandLabel}
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-7" style={{ color: "hsl(var(--homepage-footer-text) / 0.7)" }}>
              {t.footerDescription}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3
                  className="text-sm font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "hsl(var(--homepage-footer-text) / 0.6)" }}
                >
                  {column.title}
                </h3>
                <div className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <SmartLink
                      key={link.label}
                      href={link.href}
                      className="homepage-focus block rounded-lg text-sm text-[hsl(var(--homepage-footer-text)/0.7)] transition-colors duration-200 hover:text-[hsl(var(--homepage-footer-text))]"
                    >
                      {link.label}
                    </SmartLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex flex-col gap-4 pt-6 text-sm md:flex-row md:items-center md:justify-between"
          style={{ color: "hsl(var(--homepage-footer-muted))" }}
        >
          <p>{t.copyright}</p>
          <div className="flex flex-wrap gap-5">
            {bottomLinks.map((item) => (
              <SmartLink
                key={item.label}
                href={item.href}
                className="homepage-focus text-[hsl(var(--homepage-footer-muted))] transition-colors duration-200 hover:text-[hsl(var(--homepage-footer-text)/0.7)]"
              >
                {item.label}
              </SmartLink>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
