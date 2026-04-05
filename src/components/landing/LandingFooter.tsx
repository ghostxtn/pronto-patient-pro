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
                  {content.brand.name}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em]" style={{ color: "hsl(var(--homepage-footer-text) / 0.6)" }}>
                  {content.brand.label}
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-7" style={{ color: "hsl(var(--homepage-footer-text) / 0.7)" }}>
              {footer.description}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {footer.columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "hsl(var(--homepage-footer-text) / 0.6)" }}>
                  {column.title}
                </h3>
                <div className="mt-4 space-y-3">
                  {column.links.map((link) =>
                    link.href ? (
                      <SmartLink
                        key={link.label}
                        href={link.href}
                        className="homepage-focus block rounded-lg text-sm text-[hsl(var(--homepage-footer-text)/0.7)] transition-colors duration-200 hover:text-[hsl(var(--homepage-footer-text))]"
                      >
                        {link.label}
                      </SmartLink>
                    ) : (
                      <span
                        key={link.label}
                        className="block rounded-lg text-sm"
                        style={{ color: "hsl(var(--homepage-footer-text) / 0.4)" }}
                      >
                        {link.label}
                      </span>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-sm md:flex-row md:items-center md:justify-between" style={{ color: "hsl(var(--homepage-footer-muted))" }}>
          <p>{footer.copyright}</p>
          <div className="flex flex-wrap gap-5">
            {footer.bottomLinks.map((item) =>
              item.href ? (
                <SmartLink
                  key={item.label}
                  href={item.href}
                  className="homepage-focus text-[hsl(var(--homepage-footer-muted))] transition-colors duration-200 hover:text-[hsl(var(--homepage-footer-text)/0.7)]"
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
