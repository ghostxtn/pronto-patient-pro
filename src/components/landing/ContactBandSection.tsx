import { ArrowRight, Phone, MapPin, Clock, Accessibility } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { LandingContent } from "./content";
import SmartLink from "./SmartLink";

type ContactBandProps = {
  copy: LandingContent["contactBand"];
};

export default function ContactBandSection({ copy }: ContactBandProps) {
  return (
    <section id={copy.sectionId} className="py-12 md:py-16">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="homepage-section-gradient rounded-[2rem] border border-homepage-border-strong p-6 md:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
                {copy.eyebrow}
              </p>
              <h2 className="mt-3 max-w-lg font-display text-3xl leading-tight tracking-tight text-homepage-ink md:text-4xl">
                {copy.title}
              </h2>
              <p className="mt-4 max-w-lg text-base leading-7 text-homepage-text">
                {copy.description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  className="homepage-focus-soft h-11 rounded-full border border-homepage-brand bg-homepage-brand px-5 text-sm text-white hover:bg-homepage-brand-deep"
                >
                  <SmartLink href={copy.primaryAction.href ?? "/contact"}>
                    {copy.primaryAction.label}
                    <ArrowRight className="h-4 w-4" />
                  </SmartLink>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="homepage-focus-soft h-11 rounded-full border-homepage-border-strong bg-transparent px-5 text-sm text-homepage-muted hover:bg-homepage-shell-cool hover:text-homepage-ink"
                >
                  <SmartLink href={copy.secondaryAction.href ?? "/appointment-process"}>
                    {copy.secondaryAction.label}
                  </SmartLink>
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-3 rounded-2xl border border-homepage-border bg-white/80 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-homepage-border-strong bg-homepage-shell text-homepage-brand">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-homepage-soft">Telefon</p>
                  <p className="mt-1 text-sm font-medium text-homepage-ink">{copy.phone}</p>
                </div>
              </div>

              <div className="flex gap-3 rounded-2xl border border-homepage-border bg-white/80 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-homepage-border-strong bg-homepage-shell text-homepage-brand">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-homepage-soft">Adres</p>
                  <p className="mt-1 text-sm font-medium text-homepage-ink">{copy.address}</p>
                </div>
              </div>

              <div className="flex gap-3 rounded-2xl border border-homepage-border bg-white/80 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-homepage-border-strong bg-homepage-shell text-homepage-brand">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-homepage-soft">Çalışma Saatleri</p>
                  <p className="mt-1 text-sm font-medium text-homepage-ink">{copy.hours}</p>
                </div>
              </div>

              <div className="flex gap-3 rounded-2xl border border-homepage-border bg-white/80 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-homepage-border-strong bg-homepage-shell text-homepage-brand">
                  <Accessibility className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-homepage-soft">Erişim</p>
                  <p className="mt-1 text-sm font-medium text-homepage-ink">{copy.accessNote}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
