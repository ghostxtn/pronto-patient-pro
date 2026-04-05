import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNav from "@/components/landing/LandingNav";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHomepagePreviewData } from "@/hooks/useHomepagePreviewData";

const appleEase = [0.25, 0.1, 0.25, 1] as const;

export default function Specialties() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const previewData = useHomepagePreviewData(lang);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen bg-homepage-shell text-homepage-ink"
    >
      <LandingNav />

      <main className="pt-20">
        <section className="mx-auto max-w-[1200px] px-6 pb-8 pt-10 md:px-10 md:pb-12 md:pt-16 lg:px-20 lg:pb-12 lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: appleEase }}
          >
            <p
              className="text-[11px] font-medium uppercase tracking-[2px] text-homepage-muted"
            >
              UZMANLIK ALANLARI
            </p>
            <h1 className="font-display mt-2 text-[34px] font-bold leading-tight text-homepage-ink md:text-[42px]">
              Uzmanlık Alanlarımız
            </h1>
            <p
              className="mt-3 max-w-[560px] text-[16px] leading-7 text-homepage-muted"
            >
              Kliniğimizin uzmanlık alanlarını ve bu alanlarda görev yapan hekimlerimizi inceleyin.
            </p>
          </motion.div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 pb-12 md:px-10 md:pb-16 lg:px-20 lg:pb-20">
          {previewData.isLoading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`specialty-skeleton-${index}`}
                  className="flex flex-col"
                  style={{ borderRadius: "18px", overflow: "visible", background: "transparent" }}
                >
                  <div
                    className="animate-pulse"
                    style={{
                      height: "240px",
                      width: "100%",
                      borderRadius: "18px",
                      background:
                        "linear-gradient(160deg, rgb(var(--homepage-shell-cool)) 0%, rgb(var(--homepage-support-tint)) 55%, rgb(var(--homepage-border)) 100%)",
                    }}
                  />
                  <div style={{ height: "16px" }} />
                  <div className="px-2 pb-2 text-center">
                    <div className="mx-auto h-7 w-40 rounded-full bg-homepage-shell-cool" />
                    <div className="mx-auto mt-3 h-4 w-56 rounded-full bg-homepage-support-tint" />
                    <div className="mx-auto mt-2 h-4 w-44 rounded-full bg-homepage-shell-cool" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!previewData.isLoading && previewData.isError ? (
            <div
              className="rounded-[24px] border border-homepage-border bg-homepage-shell-cool px-6 py-10 text-center text-homepage-muted"
            >
              Uzmanlık verileri şu anda yüklenemiyor. Lütfen biraz sonra tekrar deneyin.
            </div>
          ) : null}

          {!previewData.isLoading && !previewData.isError && previewData.hasLoadedEmptySpecialties ? (
            <div
              className="rounded-[24px] border border-homepage-border bg-homepage-shell-cool px-6 py-10 text-center text-homepage-muted"
            >
              Görüntülenecek aktif uzmanlık alanı bulunamadı.
            </div>
          ) : null}

          {!previewData.isLoading && !previewData.isError ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {previewData.specialties.map((spec, index) => (
                <motion.article
                  key={spec.id}
                  initial={{ opacity: 0, y: 20, x: -20 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: (index % 5) * 0.07, ease: appleEase }}
                  whileHover={{ scale: 1.02 }}
                  className="flex flex-col items-stretch"
                  style={{
                    borderRadius: "18px",
                    overflow: "visible",
                    background: "transparent",
                  }}
                >
                  <div
                    style={{
                      height: "240px",
                      width: "100%",
                      borderRadius: "18px",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {spec.imageSrc ? (
                      <img
                        src={spec.imageSrc}
                        alt={spec.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "center",
                          display: "block",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background:
                            "linear-gradient(160deg, rgb(var(--homepage-shell-cool)) 0%, rgb(var(--homepage-support-tint)) 55%, rgb(var(--homepage-border)) 100%)",
                        }}
                      />
                    )}
                  </div>

                  <div style={{ height: "16px" }} />

                  <div
                    className="flex flex-col items-center px-2 pb-2 text-center"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    <h2
                      className="mb-[6px] text-[22px] font-bold text-[#1a2e3b]"
                      style={{ fontFamily: "Manrope, sans-serif" }}
                    >
                      {spec.name}
                    </h2>

                    <p
                      className="mb-0 max-w-[220px] text-[14px] leading-[1.5] text-[#5a7a8a]"
                    >
                      {spec.description}
                    </p>

                    <div className="mt-5 flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => navigate("/request-appointment")}
                        className="homepage-focus-soft rounded-full border border-homepage-brand bg-homepage-brand px-[22px] py-[9px] text-[14px] font-semibold text-white transition-colors hover:bg-homepage-brand-deep"
                      >
                        Randevu Al
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/doctors?specialty=${spec.id}`)}
                        className="homepage-focus-soft rounded-full px-2 py-[9px] text-[14px] font-medium text-homepage-brand transition-colors hover:text-homepage-brand-deep"
                      >
                        Doktorları Gör ›
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : null}
        </section>
      </main>

      <LandingFooter />
    </motion.div>
  );
}
