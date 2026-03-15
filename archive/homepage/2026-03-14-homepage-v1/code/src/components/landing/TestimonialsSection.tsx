import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import SmartLink from "./SmartLink";
import { getLandingContent } from "./content";

export default function TestimonialsSection() {
  const { lang } = useLanguage();
  const { careAreas } = getLandingContent(lang);

  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="homepage-shadow-card grid gap-10 rounded-[2rem] border border-homepage-border-strong bg-white p-6 md:p-8 lg:grid-cols-[0.86fr_1.14fr] lg:p-10"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
              {careAreas.eyebrow}
            </p>
            <h2 className="mt-3 max-w-lg font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-[3rem]">
              {careAreas.title}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-homepage-text md:text-lg">
              {careAreas.description}
            </p>
            <Button
              variant="outline"
              asChild
              className="homepage-focus-soft mt-8 h-11 rounded-full border-homepage-border-strong bg-transparent px-5 text-sm text-homepage-muted hover:bg-homepage-shell hover:text-homepage-ink"
            >
              <SmartLink href={careAreas.action.href}>
                {careAreas.action.label}
                <ArrowRight className="h-4 w-4" />
              </SmartLink>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {careAreas.columns.map((column, index) => (
              <motion.div
                key={column.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  delay: index * 0.08,
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="rounded-[1.5rem] border border-homepage-border bg-homepage-shell p-5"
              >
                <h3 className="font-display text-2xl tracking-tight text-homepage-ink">{column.title}</h3>
                <div className="mt-5 divide-y divide-homepage-border">
                  {column.links.map((link) => (
                    <SmartLink
                      key={link}
                      href={careAreas.action.href}
                      className="homepage-focus-soft flex items-center justify-between gap-4 rounded-xl py-3 text-sm text-homepage-muted transition-colors duration-200 hover:text-homepage-ink"
                    >
                      <span>{link}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-homepage-soft" />
                    </SmartLink>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
