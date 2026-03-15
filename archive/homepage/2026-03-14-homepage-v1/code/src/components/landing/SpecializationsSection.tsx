import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import SmartLink from "./SmartLink";
import { getLandingContent } from "./content";

export default function SpecializationsSection() {
  const { lang } = useLanguage();
  const { showcase } = getLandingContent(lang);

  return (
    <section id="care-areas" className="bg-homepage-shell-cool py-16 md:py-20">
      <div className="container">
        <div className="grid gap-10 lg:grid-cols-[0.84fr_1.16fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
              {showcase.eyebrow}
            </p>
            <h2 className="mt-3 max-w-lg font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-[3.1rem]">
              {showcase.title}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-homepage-text md:text-lg">
              {showcase.description}
            </p>
            <Button
              variant="outline"
              asChild
              className="homepage-focus-soft mt-8 h-11 rounded-full border-homepage-border-strong bg-white/70 px-5 text-sm text-homepage-muted hover:bg-white hover:text-homepage-ink"
            >
              <SmartLink href={showcase.action.href}>
                {showcase.action.label}
                <ArrowRight className="h-4 w-4" />
              </SmartLink>
            </Button>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {showcase.cards.map((card, index) => (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  delay: index * 0.08,
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="homepage-shadow-card group overflow-hidden rounded-[1.65rem] border border-homepage-border bg-white"
              >
                <div className="relative h-[320px] overflow-hidden">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,42,67,0.05)_0%,rgba(10,74,94,0.72)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <h3 className="font-display text-[1.7rem] leading-none tracking-tight">{card.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-white/[0.88]">{card.subtitle}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
