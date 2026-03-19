import { motion } from "framer-motion";
import { ArrowRight, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LandingFooter from "@/components/landing/LandingFooter";
import SmartLink from "@/components/landing/SmartLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLandingContent } from "@/components/landing/content";
import { usePublicSpecialties } from "@/hooks/usePublicSpecialties";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.06,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

export default function Specialties() {
  const { lang } = useLanguage();
  const content = getLandingContent(lang);
  const { specialties, isLoading, isError, hasLoadedEmptySpecialties } = usePublicSpecialties();

  return (
    <div className="homepage-shell-gradient min-h-screen bg-homepage-shell text-homepage-ink">
      <header className="sticky top-0 z-40 border-b border-homepage-border bg-white/90 backdrop-blur-md">
        <div className="container flex h-20 items-center justify-between gap-4">
          <SmartLink href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-homepage-border bg-homepage-brand-deep text-white">
              <Stethoscope className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-[1.7rem] leading-none tracking-tight text-homepage-ink">
                {content.brand.name}
              </span>
              <span className="mt-1 block truncate text-[0.68rem] uppercase tracking-[0.22em] text-homepage-soft">
                {content.brand.label}
              </span>
            </span>
          </SmartLink>

          <div className="flex items-center gap-3">
            <SmartLink
              href="/"
              className="homepage-focus hidden rounded-full px-4 py-2 text-sm font-medium text-homepage-muted transition-colors duration-200 hover:text-homepage-ink md:inline-flex"
            >
              {lang === "tr" ? "Anasayfa" : "Home"}
            </SmartLink>
            <SmartLink
              href="/doctors"
              className="homepage-focus hidden rounded-full px-4 py-2 text-sm font-medium text-homepage-muted transition-colors duration-200 hover:text-homepage-ink md:inline-flex"
            >
              {lang === "tr" ? "Doktorlar" : "Doctors"}
            </SmartLink>
            <LanguageSwitcher className="h-11 w-11 rounded-full border border-homepage-border text-homepage-muted hover:border-homepage-border-strong hover:bg-homepage-shell" />
            <Button
              asChild
              className="homepage-focus rounded-full border border-homepage-brand bg-homepage-brand px-5 text-sm font-medium text-white hover:bg-homepage-brand-deep"
            >
              <SmartLink href="/request-appointment">
                {lang === "tr" ? "Randevu Talebi Olustur" : "Create Appointment Request"}
              </SmartLink>
            </Button>
          </div>
        </div>
      </header>

      <main className="pb-16 pt-10 md:pb-20 md:pt-14">
        <div className="container">
          <motion.section initial="hidden" animate="visible">
            <motion.div custom={0} variants={fadeUp} className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
                {lang === "tr" ? "Uzmanlik Alanlari" : "Specialties"}
              </p>
              <h1 className="mt-3 font-display text-5xl leading-[0.95] tracking-tight text-homepage-ink md:text-6xl">
                {lang === "tr"
                  ? "Klinigin guncel uzmanlik alanlarini ve bu alanlarda calisan hekimleri birlikte inceleyin."
                  : "Review the clinic's current specialties together with the doctors working in them."}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-homepage-text md:text-lg">
                {lang === "tr"
                  ? "Bu yuzey, gercek klinik uzmanlik kayitlarini ve o alanlarda aktif olan hekimleri gosterir. Anlik uygunluk veya aninda rezervasyon vaadi sunmaz."
                  : "This surface shows real clinic specialization records and the active doctors connected to them. It does not promise instant availability or instant booking."}
              </p>
            </motion.div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <motion.article
                      key={`specialty-loading-${index}`}
                      custom={index + 1}
                      variants={fadeUp}
                      className="homepage-shadow-card overflow-hidden rounded-[1.7rem] border border-homepage-border bg-white"
                    >
                      <div className="h-[220px] animate-pulse bg-homepage-shell-cool" />
                      <div className="space-y-3 p-5">
                        <div className="h-8 w-40 rounded bg-homepage-shell-cool" />
                        <div className="h-4 w-full rounded bg-homepage-shell-cool" />
                        <div className="h-4 w-2/3 rounded bg-homepage-shell-cool" />
                      </div>
                    </motion.article>
                  ))
                : null}

              {!isLoading && isError ? (
                <motion.article
                  custom={1}
                  variants={fadeUp}
                  className="homepage-shadow-card rounded-[1.7rem] border border-homepage-border bg-white p-8 text-center lg:col-span-2"
                >
                  <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
                    {lang === "tr"
                      ? "Uzmanlik verileri su anda yuklenemiyor."
                      : "Specialty data could not be loaded right now."}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-homepage-text">
                    {lang === "tr"
                      ? "Lutfen biraz sonra tekrar deneyin."
                      : "Please try again shortly."}
                  </p>
                </motion.article>
              ) : null}

              {!isLoading && !isError && hasLoadedEmptySpecialties ? (
                <motion.article
                  custom={1}
                  variants={fadeUp}
                  className="homepage-shadow-card rounded-[1.7rem] border border-homepage-border bg-white p-8 text-center lg:col-span-2"
                >
                  <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
                    {lang === "tr"
                      ? "Goruntulenecek aktif uzmanlik alani bulunamadi."
                      : "No active specialties found."}
                  </h2>
                </motion.article>
              ) : null}

              {!isLoading && !isError
                ? specialties.map((specialty, index) => (
                    <motion.article
                      key={specialty.id}
                      custom={index + 1}
                      variants={fadeUp}
                      className="homepage-shadow-card overflow-hidden rounded-[1.7rem] border border-homepage-border bg-white"
                    >
                      <div className="relative h-[220px] overflow-hidden bg-homepage-shell-cool">
                        <img
                          src={specialty.imageSrc}
                          alt={specialty.name}
                          className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,42,67,0.08)_0%,rgba(16,42,67,0.76)_100%)]" />
                        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
                            {lang === "tr" ? "Uzmanlik" : "Specialty"}
                          </p>
                          <h2 className="mt-2 font-display text-[1.9rem] leading-none tracking-tight">
                            {specialty.name}
                          </h2>
                          {specialty.previewText ? (
                            <p className="mt-3 text-sm leading-6 text-white/88">{specialty.previewText}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="p-5">
                        <p className="text-sm leading-7 text-homepage-text">{specialty.description}</p>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <Badge
                            variant="secondary"
                            className="rounded-full border border-homepage-border bg-homepage-shell px-3 py-1 text-xs font-medium text-homepage-muted"
                          >
                            {lang === "tr"
                              ? `${specialty.doctorCount} aktif doktor`
                              : `${specialty.doctorCount} active doctor${specialty.doctorCount === 1 ? "" : "s"}`}
                          </Badge>
                          {specialty.relatedDoctors.map((doctor) => (
                            <Badge
                              key={`${specialty.id}-${doctor.id}`}
                              variant="secondary"
                              className="rounded-full border border-homepage-border bg-homepage-shell px-3 py-1 text-xs font-medium text-homepage-muted"
                            >
                              {doctor.fullName}
                            </Badge>
                          ))}
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                          {specialty.doctorCount > 0 ? (
                            <Button asChild className="rounded-full">
                              <SmartLink href={`/doctors?specialty=${specialty.slug}`}>
                                {lang === "tr" ? "Ilgili Doktorlari Gor" : "View Related Doctors"}
                                <ArrowRight className="h-4 w-4" />
                              </SmartLink>
                            </Button>
                          ) : (
                            <Button type="button" disabled className="rounded-full">
                              {lang === "tr" ? "Aktif doktor henuz gorunmuyor" : "No active doctor yet"}
                            </Button>
                          )}
                          <Button asChild variant="outline" className="rounded-full">
                            <SmartLink href="/request-appointment">
                              {lang === "tr" ? "Randevu Talebi Olustur" : "Create Appointment Request"}
                            </SmartLink>
                          </Button>
                        </div>
                      </div>
                    </motion.article>
                  ))
                : null}
            </div>
          </motion.section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
