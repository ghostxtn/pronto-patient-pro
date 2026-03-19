import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, ChevronDown, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LandingFooter from "@/components/landing/LandingFooter";
import SmartLink from "@/components/landing/SmartLink";
import { getLandingContent } from "@/components/landing/content";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePublicDoctors } from "@/hooks/usePublicDoctors";

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

function getGridColumns(width: number) {
  if (width >= 1024) {
    return 3;
  }

  if (width >= 768) {
    return 2;
  }

  return 1;
}

export default function FindDoctors() {
  const { lang } = useLanguage();
  const content = getLandingContent(lang);
  const { doctors, specialties, isLoading, isError, hasLoadedEmptyDoctors } = usePublicDoctors();
  const [searchParams, setSearchParams] = useSearchParams();
  const [columns, setColumns] = useState(() =>
    typeof window === "undefined" ? 3 : getGridColumns(window.innerWidth),
  );

  const selectedSlug = searchParams.get("doctor");
  const selectedSpecialtySlug = searchParams.get("specialty");

  useEffect(() => {
    const onResize = () => setColumns(getGridColumns(window.innerWidth));

    onResize();
    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  const activeSpecialty = useMemo(() => {
    if (!selectedSpecialtySlug) {
      return "all";
    }

    const matchedSpecialty = specialties.find(
      (specialty) => specialty.slug === selectedSpecialtySlug || specialty.key === selectedSpecialtySlug,
    );

    return matchedSpecialty?.key ?? "all";
  }, [selectedSpecialtySlug, specialties]);

  const filteredDoctors = useMemo(() => {
    if (activeSpecialty === "all") {
      return doctors;
    }

    return doctors.filter((doctor) => doctor.specialtyId === activeSpecialty);
  }, [activeSpecialty, doctors]);

  const selectedDoctor = useMemo(
    () => filteredDoctors.find((doctor) => doctor.slug === selectedSlug) ?? null,
    [filteredDoctors, selectedSlug],
  );

  useEffect(() => {
    if (selectedSpecialtySlug && !isLoading) {
      const specialtyExists = specialties.some(
        (specialty) => specialty.slug === selectedSpecialtySlug || specialty.key === selectedSpecialtySlug,
      );

      if (!specialtyExists) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete("specialty");
        setSearchParams(nextParams, { replace: true });
        return;
      }
    }

    if (!selectedSlug || isLoading) {
      return;
    }

    const existsInAllDoctors = doctors.some((doctor) => doctor.slug === selectedSlug);
    if (!existsInAllDoctors) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("doctor");
      setSearchParams(nextParams, { replace: true });
      return;
    }

    const existsInFilteredDoctors = filteredDoctors.some((doctor) => doctor.slug === selectedSlug);
    if (!existsInFilteredDoctors) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("doctor");
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    doctors,
    filteredDoctors,
    isLoading,
    searchParams,
    selectedSlug,
    selectedSpecialtySlug,
    setSearchParams,
    specialties,
  ]);

  function setSpecialtyFilter(nextSpecialty: string) {
    const nextParams = new URLSearchParams(searchParams);

    if (nextSpecialty === "all") {
      nextParams.delete("specialty");
    } else {
      const matchedSpecialty = specialties.find((specialty) => specialty.key === nextSpecialty);
      nextParams.set("specialty", matchedSpecialty?.slug ?? nextSpecialty);
    }

    nextParams.delete("doctor");
    setSearchParams(nextParams);
  }

  function toggleDoctor(slug: string) {
    const nextParams = new URLSearchParams(searchParams);

    if (selectedSlug === slug) {
      nextParams.delete("doctor");
    } else {
      nextParams.set("doctor", slug);
    }

    setSearchParams(nextParams);
  }

  function closeDoctorDetail() {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("doctor");
    setSearchParams(nextParams);
  }

  const selectedIndex = selectedDoctor
    ? filteredDoctors.findIndex((doctor) => doctor.slug === selectedDoctor.slug)
    : -1;

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
              href="/specialties"
              className="homepage-focus hidden rounded-full px-4 py-2 text-sm font-medium text-homepage-muted transition-colors duration-200 hover:text-homepage-ink md:inline-flex"
            >
              {lang === "tr" ? "Uzmanlik Alanlari" : "Specialties"}
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
                {lang === "tr" ? "Doktorlarimiz" : "Doctors"}
              </p>
              <h1 className="mt-3 font-display text-5xl leading-[0.95] tracking-tight text-homepage-ink md:text-6xl">
                {lang === "tr"
                  ? "Klinik ekibi, uzmanlik alanlari ve kisa profiller tek yuzeyde."
                  : "The clinic team, specialties, and short profiles in one surface."}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-homepage-text md:text-lg">
                {lang === "tr"
                  ? "Gercek aktif hekim kadrosunu uzmanlik alanlariyla birlikte inceleyin. Bu yuzey kesif icindir; anlik uygunluk veya aninda rezervasyon vaadi sunmaz."
                  : "Review the current active doctors with their specialties. This surface supports discovery, not instant availability or instant booking promises."}
              </p>
            </motion.div>

            <motion.div
              custom={1}
              variants={fadeUp}
              className="homepage-shadow-card mt-10 rounded-[2rem] border border-homepage-border-strong bg-white p-5 md:p-6"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant={activeSpecialty === "all" ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setSpecialtyFilter("all")}
                >
                  {lang === "tr" ? "Tumu" : "All"}
                </Button>
                {specialties.map((specialty) => (
                  <Button
                    key={specialty.key}
                    type="button"
                    variant={activeSpecialty === specialty.key ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setSpecialtyFilter(specialty.key)}
                  >
                    {specialty.name}
                  </Button>
                ))}
              </div>
            </motion.div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {isLoading
                ? Array.from({ length: 6 }).map((_, index) => (
                    <motion.article
                      key={`doctor-loading-${index}`}
                      custom={index + 2}
                      variants={fadeUp}
                      className="homepage-shadow-card overflow-hidden rounded-[1.7rem] border border-homepage-border bg-white"
                    >
                      <div className="h-[280px] animate-pulse bg-homepage-shell-cool" />
                      <div className="space-y-3 p-5">
                        <div className="h-5 w-32 rounded bg-homepage-shell-cool" />
                        <div className="h-8 w-2/3 rounded bg-homepage-shell-cool" />
                        <div className="h-4 w-40 rounded bg-homepage-shell-cool" />
                        <div className="h-12 rounded bg-homepage-shell-cool" />
                      </div>
                    </motion.article>
                  ))
                : null}

              {!isLoading && isError ? (
                <motion.div
                  custom={2}
                  variants={fadeUp}
                  className="homepage-shadow-card rounded-[1.7rem] border border-homepage-border bg-white p-8 text-center md:col-span-2 lg:col-span-3"
                >
                  <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
                    {lang === "tr"
                      ? "Doktor verileri su anda yuklenemiyor."
                      : "Doctor data could not be loaded right now."}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-homepage-text">
                    {lang === "tr"
                      ? "Lutfen biraz sonra tekrar deneyin."
                      : "Please try again shortly."}
                  </p>
                </motion.div>
              ) : null}

              {!isLoading && !isError && filteredDoctors.length === 0 ? (
                <motion.div
                  custom={2}
                  variants={fadeUp}
                  className="homepage-shadow-card rounded-[1.7rem] border border-homepage-border bg-white p-8 text-center md:col-span-2 lg:col-span-3"
                >
                  <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
                    {hasLoadedEmptyDoctors
                      ? lang === "tr"
                        ? "Goruntulenecek aktif doktor bulunamadi."
                        : "No active doctors found."
                      : lang === "tr"
                        ? "Secili uzmanlikta aktif doktor bulunamadi."
                        : "No active doctors found for the selected specialty."}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-homepage-text">
                    {hasLoadedEmptyDoctors
                      ? lang === "tr"
                        ? "Klinik kayitlarinda aktif hekim bulunmuyorsa bu alan bos gorunur."
                        : "This state appears only when there are no active doctors in the clinic records."
                      : lang === "tr"
                        ? "Secili filtre aktif hekim kayitlariyla eslesmiyor."
                        : "The selected filter does not match any active doctor records."}
                  </p>
                </motion.div>
              ) : null}

              {!isLoading && !isError
                ? filteredDoctors.flatMap((doctor, index) => {
                    const isSelected = doctor.slug === selectedSlug;
                    const currentRow = Math.floor(index / columns);
                    const rowStart = currentRow * columns;
                    const rowEnd = Math.min(rowStart + columns - 1, filteredDoctors.length - 1);
                    const shouldRenderDetail =
                      selectedIndex >= rowStart &&
                      selectedIndex <= rowEnd &&
                      index === rowEnd &&
                      selectedDoctor;

                    const card = (
                      <motion.article
                        key={doctor.id}
                        custom={index + 2}
                        variants={fadeUp}
                        className={[
                          "homepage-shadow-card overflow-hidden rounded-[1.7rem] border bg-white transition-all duration-300",
                          isSelected
                            ? "border-homepage-brand shadow-[0_28px_60px_rgba(16,42,67,0.14)]"
                            : "border-homepage-border",
                        ].join(" ")}
                      >
                        <div className="relative h-[280px] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(42,127,132,0.18),transparent_55%),linear-gradient(180deg,#e8f2f1_0%,#c9dddd_100%)]">
                          <img
                            src={doctor.imageSrc}
                            alt={doctor.fullName}
                            className="h-full w-full object-contain p-6 transition-transform duration-700 hover:scale-[1.02]"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(16,42,67,0)_0%,rgba(16,42,67,0.84)_100%)] p-5 text-white">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/72">
                              {doctor.title}
                            </p>
                            <h2 className="mt-2 font-display text-[1.85rem] leading-none tracking-tight">
                              {doctor.fullName}
                            </h2>
                            <p className="mt-3 text-sm leading-6 text-white/88">{doctor.specialtyName}</p>
                          </div>
                        </div>

                        <div className="p-5">
                          <p className="text-sm leading-7 text-homepage-text">{doctor.previewText}</p>
                          <div className="mt-5 flex flex-wrap gap-2">
                            {doctor.focusTags.map((tag) => (
                              <Badge
                                key={`${doctor.id}-${tag}`}
                                variant="secondary"
                                className="rounded-full border border-homepage-border bg-homepage-shell px-3 py-1 text-xs font-medium text-homepage-muted"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            className="mt-5 w-full rounded-full"
                            onClick={() => toggleDoctor(doctor.slug)}
                          >
                            {lang === "tr" ? "Profili Incele" : "Review Profile"}
                            <ChevronDown
                              className={[
                                "ml-2 h-4 w-4 transition-transform duration-200",
                                isSelected ? "rotate-180" : "",
                              ].join(" ")}
                            />
                          </Button>
                        </div>
                      </motion.article>
                    );

                    if (!shouldRenderDetail) {
                      return [card];
                    }

                    const detail = (
                      <motion.section
                        key={`detail-${selectedDoctor.slug}`}
                        custom={index + 3}
                        variants={fadeUp}
                        className="homepage-shadow-card rounded-[2rem] border border-homepage-border-strong bg-white p-6 md:col-span-2 md:p-8 lg:col-span-3"
                      >
                        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
                          <div className="overflow-hidden rounded-[1.6rem] border border-homepage-border bg-[radial-gradient(circle_at_top,rgba(42,127,132,0.18),transparent_55%),linear-gradient(180deg,#e8f2f1_0%,#c9dddd_100%)]">
                            <img
                              src={selectedDoctor.imageSrc}
                              alt={selectedDoctor.fullName}
                              className="h-full w-full object-contain p-8"
                            />
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
                              {selectedDoctor.title}
                            </p>
                            <h3 className="mt-3 font-display text-4xl leading-tight tracking-tight text-homepage-ink">
                              {selectedDoctor.fullName}
                            </h3>
                            <p className="mt-3 text-base leading-7 text-homepage-text">
                              {selectedDoctor.specialtyName}
                            </p>

                            {selectedDoctor.biography ? (
                              <p className="mt-6 max-w-3xl text-base leading-8 text-homepage-text">
                                {selectedDoctor.biography}
                              </p>
                            ) : (
                              <p className="mt-6 max-w-3xl text-base leading-8 text-homepage-text">
                                {selectedDoctor.previewText}
                              </p>
                            )}

                            <div className="mt-6 flex flex-wrap gap-2">
                              {selectedDoctor.focusTags.map((tag) => (
                                <span
                                  key={`detail-${selectedDoctor.id}-${tag}`}
                                  className="rounded-full border border-homepage-border bg-homepage-shell px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-homepage-muted"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                              <Button asChild className="rounded-full px-6">
                                <SmartLink href="/request-appointment">
                                  {lang === "tr" ? "Randevu Talebi Olustur" : "Create Appointment Request"}
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </SmartLink>
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                className="rounded-full px-6"
                                onClick={closeDoctorDetail}
                              >
                                {lang === "tr" ? "Detayi Kapat" : "Close Detail"}
                              </Button>
                            </div>

                            <p className="mt-5 text-sm leading-7 text-homepage-muted">
                              {lang === "tr"
                                ? "Bu yuzey doktor kesfi icindir. Uygunluk ve kesin randevu plani klinik ekibi tarafindan talep sonrasinda netlestirilir."
                                : "This surface supports doctor discovery. Availability and confirmed scheduling are clarified by the clinic team after the request."}
                            </p>
                          </div>
                        </div>
                      </motion.section>
                    );

                    return [card, detail];
                  })
                : null}
            </div>
          </motion.section>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
