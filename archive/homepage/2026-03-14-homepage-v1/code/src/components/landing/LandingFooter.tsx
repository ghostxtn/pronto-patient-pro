import { Stethoscope } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import SmartLink from "./SmartLink";
import { getLandingContent } from "./content";

export default function LandingFooter() {
  const { lang } = useLanguage();
  const content = getLandingContent(lang);
  const { footer } = content;

  return (
    <footer id="contact" className="homepage-footer-gradient mt-0 pb-10 pt-12 text-homepage-shell md:pb-12 md:pt-16">
      <div className="container">
        <div className="grid gap-10 border-b border-white/[0.12] pb-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-md">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/[0.18] bg-white/[0.08]">
                <Stethoscope className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-[1.8rem] leading-none tracking-tight text-white">
                  {content.brand.name}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/[0.68]">
                  {content.brand.label}
                </p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-7 text-white/[0.78]">
              {lang === "tr"
                ? "Temiz bilgi mimarisi, sakin tipografi ve güven veren bakım akışı bir arada."
                : "Clean information architecture, calm typography, and a care flow that feels trustworthy."}
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {footer.columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-white/[0.72]">
                  {column.title}
                </h3>
                <div className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <SmartLink
                      key={link.label}
                      href={link.href}
                      className="homepage-focus-inverse block rounded-lg text-sm text-white/[0.78] transition-colors duration-200 hover:text-white"
                    >
                      {link.label}
                    </SmartLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-sm text-white/[0.56] md:flex-row md:items-center md:justify-between">
          <p>{footer.copyright}</p>
          <div className="flex flex-wrap gap-5">
            {footer.legal.map((item) => (
              <span key={item} className="transition-colors duration-200 hover:text-white/[0.78]">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
