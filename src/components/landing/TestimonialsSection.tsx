import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { LandingContent } from "./content";
import type { HomepageSpecialtyPreviewItem } from "@/lib/homepage-preview";
import SmartLink from "./SmartLink";

type SpecialtyPreviewSectionProps = {
  copy: LandingContent["specialtyPreview"];
  specialties: HomepageSpecialtyPreviewItem[];
  isLoading: boolean;
  isError?: boolean;
  showEmptyState?: boolean;
};

function SpecialtyPreviewSkeleton() {
  return (
    <article className="homepage-shadow-card overflow-hidden rounded-[1.65rem] border border-homepage-border bg-white">
      <div className="h-[240px] animate-pulse bg-homepage-shell-cool" />
      <div className="space-y-3 p-5">
        <div className="h-8 w-2/3 rounded bg-homepage-shell-cool" />
        <div className="h-4 w-full rounded bg-homepage-shell-cool" />
        <div className="h-4 w-4/5 rounded bg-homepage-shell-cool" />
      </div>
    </article>
  );
}

export default function TestimonialsSection({
  copy,
  specialties,
  isLoading,
  isError,
  showEmptyState,
}: SpecialtyPreviewSectionProps) {
  return (
    <section id={copy.sectionId} className="py-16 md:py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-10 rounded-[2rem] border border-homepage-border-strong bg-white p-6 md:p-8 lg:grid-cols-[0.86fr_1.14fr] lg:p-10"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
              {copy.eyebrow}
            </p>
            <h2 className="mt-3 max-w-lg font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-[3rem]">
              {copy.title}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-homepage-text md:text-lg">
              {copy.description}
            </p>
            <Button
              variant="outline"
              asChild
              className="homepage-focus-soft mt-8 h-11 rounded-full border-homepage-border-strong bg-transparent px-5 text-sm text-homepage-muted hover:bg-homepage-shell hover:text-homepage-ink"
            >
              <SmartLink href={copy.action.href ?? "/specialties"}>
                {copy.action.label}
                <ArrowRight className="h-4 w-4" />
              </SmartLink>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <SpecialtyPreviewSkeleton key={`specialty-skeleton-${index}`} />
                ))
              : null}

            {!isLoading && isError ? (
              <motion.article
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="homepage-shadow-card rounded-[1.65rem] border border-homepage-border bg-homepage-shell p-6 sm:col-span-2 xl:col-span-3"
              >
                <p className="text-sm leading-7 text-homepage-text">{copy.errorState}</p>
              </motion.article>
            ) : null}

            {!isLoading && !isError && showEmptyState ? (
              <motion.article
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="homepage-shadow-card rounded-[1.65rem] border border-homepage-border bg-homepage-shell p-6 sm:col-span-2 xl:col-span-3"
              >
                <p className="text-sm leading-7 text-homepage-text">{copy.emptyState}</p>
              </motion.article>
            ) : null}

            {!isLoading
              ? specialties.map((specialty, index) => (
                  <motion.article
                    key={specialty.id}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{
                      delay: index * 0.08,
                      duration: 0.6,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="homepage-shadow-card group overflow-hidden rounded-[1.65rem] border border-homepage-border bg-homepage-shell-cool"
                  >
                    <div className="relative h-[240px] overflow-hidden">
                      <img
                        src={specialty.imageSrc}
                        alt={specialty.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,42,67,0.06)_0%,rgba(10,74,94,0.76)_100%)]" />
                      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                        <h3 className="font-display text-[1.7rem] leading-none tracking-tight">
                          {specialty.name}
                        </h3>
                        {specialty.previewText ? (
                          <p className="mt-3 text-sm leading-6 text-white/88">
                            {specialty.previewText}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-sm leading-6 text-homepage-text">{specialty.description}</p>
                    </div>
                  </motion.article>
                ))
              : null}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
