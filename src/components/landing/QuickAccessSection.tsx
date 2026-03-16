import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import SmartLink from "./SmartLink";
import { getLandingContent } from "./content";

export default function QuickAccessSection() {
  const { lang } = useLanguage();
  const content = getLandingContent(lang);
  const { quickAccess } = content;

  return (
    <section id={quickAccess.sectionId} className="relative z-10 -mt-10 pb-8 md:-mt-14 md:pb-10">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="homepage-shadow-card grid gap-8 rounded-[2rem] border border-homepage-border-strong bg-homepage-card p-6 md:grid-cols-[0.95fr_1.05fr] md:p-8 lg:p-10"
        >
          <div className="flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
                {quickAccess.eyebrow}
              </p>
              <h2 className="mt-3 max-w-xl font-display text-4xl leading-tight tracking-tight text-homepage-ink">
                {quickAccess.title}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-homepage-text">
                {quickAccess.description}
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="homepage-focus-soft h-11 rounded-full border border-homepage-brand bg-homepage-brand px-5 text-sm text-white hover:bg-homepage-brand-deep"
              >
                <SmartLink href={quickAccess.primaryAction.href ?? "/request-appointment"}>
                  {quickAccess.primaryAction.label}
                  <ArrowRight className="h-4 w-4" />
                </SmartLink>
              </Button>
              <Button
                variant="outline"
                asChild
                className="homepage-focus-soft h-11 rounded-full border-homepage-border-strong bg-transparent px-5 text-sm text-homepage-muted hover:bg-homepage-shell-cool hover:text-homepage-ink"
              >
                <SmartLink href={quickAccess.secondaryAction.href ?? "#appointment-process"}>
                  {quickAccess.secondaryAction.label}
                </SmartLink>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {quickAccess.items.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  delay: index * 0.08,
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="homepage-shadow-card rounded-[1.5rem] border border-homepage-border bg-homepage-shell p-5"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-homepage-border-strong bg-white text-sm font-semibold text-homepage-brand">
                  0{index + 1}
                </span>
                <h3 className="mt-5 font-display text-2xl leading-tight tracking-tight text-homepage-ink">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-homepage-text">{item.description}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
