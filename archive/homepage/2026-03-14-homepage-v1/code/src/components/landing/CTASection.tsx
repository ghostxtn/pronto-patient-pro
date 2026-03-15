import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import SmartLink from "./SmartLink";
import { getLandingContent } from "./content";

export default function CTASection() {
  const { lang } = useLanguage();
  const { footer } = getLandingContent(lang);

  return (
    <section className="pb-0 pt-12 md:pt-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="homepage-section-gradient rounded-[2rem] border border-homepage-border-strong p-6 md:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">{footer.eyebrow}</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
            <div>
              <h2 className="max-w-xl font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-[3rem]">
                {footer.title}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-homepage-text md:text-lg">{footer.description}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {footer.cards.map((card) => (
                <SmartLink
                  key={card.title}
                  href={card.href}
                  className="homepage-focus-soft homepage-shadow-card group rounded-[1.4rem] border border-homepage-border bg-white/[0.92] p-5 transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-[1.55rem] leading-none tracking-tight text-homepage-ink">
                        {card.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-homepage-text">{card.description}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-homepage-support transition-transform duration-300 group-hover:translate-x-1" />
                  </div>
                </SmartLink>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
