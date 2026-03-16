import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { LandingContent } from "./content";
import type { HomepageDoctorPreviewItem } from "@/lib/homepage-preview";
import SmartLink from "./SmartLink";

type DoctorPreviewSectionProps = {
  copy: LandingContent["doctorPreview"];
  doctors: HomepageDoctorPreviewItem[];
  isLoading: boolean;
  isError?: boolean;
  showEmptyState?: boolean;
};

function DoctorPreviewSkeleton() {
  return (
    <article className="homepage-shadow-card overflow-hidden rounded-[1.65rem] border border-homepage-border bg-white">
      <div className="h-[280px] animate-pulse bg-homepage-shell-cool" />
      <div className="space-y-3 p-5">
        <div className="h-4 w-24 rounded bg-homepage-shell-cool" />
        <div className="h-8 w-2/3 rounded bg-homepage-shell-cool" />
        <div className="h-4 w-32 rounded bg-homepage-shell-cool" />
        <div className="h-16 rounded bg-homepage-shell-cool" />
      </div>
    </article>
  );
}

export default function SpecializationsSection({
  copy,
  doctors,
  isLoading,
  isError,
  showEmptyState,
}: DoctorPreviewSectionProps) {
  return (
    <section id={copy.sectionId} className="bg-homepage-shell-cool py-16 md:py-20">
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
              {copy.eyebrow}
            </p>
            <h2 className="mt-3 max-w-lg font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-[3.1rem]">
              {copy.title}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-homepage-text md:text-lg">
              {copy.description}
            </p>
            <Button
              variant="outline"
              asChild
              className="homepage-focus-soft mt-8 h-11 rounded-full border-homepage-border-strong bg-white/70 px-5 text-sm text-homepage-muted hover:bg-white hover:text-homepage-ink"
            >
              <SmartLink href={copy.action.href ?? "/doctors"}>
                {copy.action.label}
                <ArrowRight className="h-4 w-4" />
              </SmartLink>
            </Button>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <DoctorPreviewSkeleton key={`doctor-skeleton-${index}`} />
                ))
              : null}

            {!isLoading && isError ? (
              <motion.article
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="homepage-shadow-card rounded-[1.65rem] border border-homepage-border bg-white p-6 sm:col-span-2 xl:col-span-3"
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
                className="homepage-shadow-card rounded-[1.65rem] border border-homepage-border bg-white p-6 sm:col-span-2 xl:col-span-3"
              >
                <p className="text-sm leading-7 text-homepage-text">{copy.emptyState}</p>
              </motion.article>
            ) : null}

            {!isLoading
              ? doctors.map((doctor, index) => {
                  const usesPlaceholder = doctor.imageSrc.endsWith(".svg");

                  return (
                    <motion.article
                      key={doctor.id}
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
                      <div className="relative h-[280px] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(42,127,132,0.18),transparent_55%),linear-gradient(180deg,#e8f2f1_0%,#c9dddd_100%)]">
                        <img
                          src={doctor.imageSrc}
                          alt={doctor.name}
                          className={[
                            "h-full w-full transition-transform duration-700 group-hover:scale-[1.03]",
                            usesPlaceholder ? "object-contain p-6" : "object-cover",
                          ].join(" ")}
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(16,42,67,0)_0%,rgba(16,42,67,0.84)_100%)] p-5 text-white">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                            {doctor.title}
                          </p>
                          <h3 className="mt-2 font-display text-[1.8rem] leading-none tracking-tight">
                            {doctor.name}
                          </h3>
                          <p className="mt-3 text-sm leading-6 text-white/88">
                            {doctor.specialtyName}
                          </p>
                        </div>
                      </div>

                      <div className="p-5">
                        <p className="text-sm leading-6 text-homepage-text">{doctor.previewText}</p>
                        {doctor.shortBio ? (
                          <p className="mt-3 text-sm leading-6 text-homepage-muted">{doctor.shortBio}</p>
                        ) : null}
                        <div className="mt-5 flex flex-wrap gap-2">
                          {doctor.focusTags.map((tag) => (
                            <span
                              key={`${doctor.id}-${tag}`}
                              className="rounded-full border border-homepage-border bg-homepage-shell px-3 py-1 text-xs font-medium text-homepage-muted"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.article>
                  );
                })
              : null}
          </div>
        </div>
      </div>
    </section>
  );
}
