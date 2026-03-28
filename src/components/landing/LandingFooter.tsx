import { useLanguage } from "@/contexts/LanguageContext";
import SmartLink from "./SmartLink";
import { getLandingContent } from "./content";

export default function LandingFooter() {
  const { lang } = useLanguage();
  const content = getLandingContent(lang);
  const { footer } = content;

  return (
    <footer
      id="footer"
      className="mt-0 pb-10 pt-12 md:pb-12 md:pt-16"
      style={{ background: "linear-gradient(145deg, #c8e6f5 0%, #b5d1cc 40%, #9ecfbd 100%)", color: "#1a2e3b" }}
    >
      <div className="container">
        <div className="grid gap-10 border-b border-[#1a2e3b]/10 pb-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <svg width="38" height="38" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="13" width="44" height="18" rx="9" fill="#65a98f" />
                <rect x="13" y="0" width="18" height="22" rx="9" fill="#4f8fe6" />
                <rect x="13" y="22" width="18" height="22" rx="9" fill="#4f8fe6" />
              </svg>
              <div>
                <p className="font-display text-[1.8rem] leading-none tracking-tight text-[#1a2e3b]">
                  {content.brand.name}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[#1a2e3b]/60">
                  {content.brand.label}
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-7 text-[#1a2e3b]/70">{footer.description}</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {footer.columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1a2e3b]/60">
                  {column.title}
                </h3>
                <div className="mt-4 space-y-3">
                  {column.links.map((link) =>
                    link.href ? (
                      <SmartLink
                        key={link.label}
                        href={link.href}
                        className="homepage-focus block rounded-lg text-sm text-[#1a2e3b]/70 transition-colors duration-200 hover:text-[#1a2e3b]"
                      >
                        {link.label}
                      </SmartLink>
                    ) : (
                      <span key={link.label} className="block rounded-lg text-sm text-[#1a2e3b]/40">
                        {link.label}
                      </span>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-sm text-[#1a2e3b]/50 md:flex-row md:items-center md:justify-between">
          <p>{footer.copyright}</p>
          <div className="flex flex-wrap gap-5">
            {footer.bottomLinks.map((item) =>
              item.href ? (
                <SmartLink
                  key={item.label}
                  href={item.href}
                  className="homepage-focus transition-colors duration-200 hover:text-[#1a2e3b]/70"
                >
                  {item.label}
                </SmartLink>
              ) : (
                <span key={item.label}>{item.label}</span>
              ),
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
