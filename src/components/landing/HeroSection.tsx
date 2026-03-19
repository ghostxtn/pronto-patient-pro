import { CirclePlay, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import SmartLink from "./SmartLink";
import { getLandingContent } from "./content";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.12,
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export default function HeroSection() {
  const { lang } = useLanguage();
  const content = getLandingContent(lang);
  const { hero } = content;

  return (
    <section className="homepage-shell-gradient relative overflow-hidden border-b border-homepage-border pt-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(42,127,132,0.14),transparent_42%)]" />

      <div className="container relative py-8 md:py-12">
        <div className="homepage-shadow-hero relative overflow-hidden rounded-[2rem] border border-homepage-border/70 bg-homepage-brand-deep">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${hero.image}")` }}
            aria-hidden="true"
          />
          <div className="homepage-hero-overlay absolute inset-0" />
          <div className="homepage-hero-overlay-bottom absolute inset-0" />

          <div className="relative grid min-h-[78vh] items-end gap-8 px-6 pb-8 pt-8 sm:px-8 lg:grid-cols-[minmax(0,1.25fr)_360px] lg:px-12 lg:pb-12">
            <div className="max-w-3xl">
              <motion.span
                custom={0}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="inline-flex rounded-full border border-white/[0.18] bg-white/[0.12] px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-white/[0.88]"
              >
                {hero.eyebrow}
              </motion.span>

              <motion.h1
                custom={1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="mt-7 max-w-2xl font-display text-5xl leading-[0.95] tracking-tight text-white md:text-6xl lg:text-[5.1rem]"
              >
                {hero.title}
              </motion.h1>

              <motion.p
                custom={2}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="mt-6 max-w-xl text-base leading-7 text-white/[0.84] md:text-lg"
              >
                {hero.description}
              </motion.p>

              <motion.div
                custom={3}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="mt-9 flex flex-col gap-3 sm:flex-row"
              >
                <Button
                  asChild
                  className="homepage-focus-inverse h-12 rounded-full border border-homepage-brand bg-homepage-brand px-6 text-sm font-semibold text-white hover:bg-homepage-brand-deep"
                >
                  <SmartLink href={hero.primaryAction.href}>
                    {hero.primaryAction.label}
                    <ArrowRight className="h-4 w-4" />
                  </SmartLink>
                </Button>

                <Button
                  variant="outline"
                  asChild
                  className="homepage-focus-inverse h-12 rounded-full border-white/30 bg-white/[0.08] px-6 text-sm font-medium text-white hover:bg-white/[0.14] hover:text-white"
                >
                  <SmartLink href={hero.secondaryAction.href}>{hero.secondaryAction.label}</SmartLink>
                </Button>
              </motion.div>
            </div>

            <motion.div
              custom={4}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="justify-self-end rounded-[1.75rem] border border-white/[0.18] bg-homepage-ink/20 p-5 text-white backdrop-blur-md sm:p-6 lg:max-w-[360px]"
            >
              <SmartLink
                href={hero.panelAction.href ?? "#appointment-process"}
                className="homepage-focus-inverse mb-6 inline-flex items-center gap-3 rounded-full border border-white/[0.18] px-4 py-2 text-sm text-white/[0.92] transition-colors duration-200 hover:bg-white/[0.12]"
              >
                <CirclePlay className="h-4 w-4" />
                {hero.panelAction.label}
              </SmartLink>

              <div className="rounded-[1.4rem] border border-white/[0.12] bg-homepage-ink/[0.28] p-5">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/[0.72]">
                  {hero.panelTitle}
                </p>
                <ul className="mt-5 space-y-4">
                  {hero.panelItems.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-white/[0.88]">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-homepage-support-tint/90" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
