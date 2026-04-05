import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import PublicPageLayout from "@/components/landing/PublicPageLayout";

const motionProps = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, amount: 0.1 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const steps = [
  {
    number: "01",
    title: "Randevu Al",
    description: "Uygun zaman aralığını seçerek süreci hızlıca başlatın.",
  },
  {
    number: "02",
    title: "Doktorunuzu Seçin",
    description: "İhtiyacınıza en uygun uzmanı ve değerlendirme alanını belirleyin.",
  },
  {
    number: "03",
    title: "Muayene Olun",
    description: "Planlanan görüşmede kliniğe gelerek bakım sürecinize başlayın.",
  },
];

export default function AppointmentProcessPage() {
  return (
    <PublicPageLayout>
      <div className="mx-auto max-w-[1200px] px-6 md:px-12 lg:px-20">
          <motion.section {...motionProps}>
            <h1
              className="font-display text-4xl font-light tracking-tight text-homepage-ink md:text-5xl"
            >
              Randevu Süreci
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-homepage-text md:text-lg">
              Randevu oluşturma, uzman seçimi ve klinik ziyareti tek bir akış içinde ilerler.
            </p>
          </motion.section>

          <motion.section
            {...motionProps}
            className="homepage-shadow-card mt-14 rounded-[32px] border border-homepage-border bg-white/70 p-8 backdrop-blur-sm md:p-10"
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex flex-1 items-center gap-6">
                  <div className="min-w-0 flex-1 rounded-[24px] bg-homepage-shell-cool p-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-homepage-brand text-base font-semibold text-white">
                      {step.number}
                    </div>
                    <h2 className="font-display mt-6 text-2xl font-light tracking-tight text-homepage-ink">
                      {step.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-homepage-text md:text-base">
                      {step.description}
                    </p>
                  </div>

                  {index < steps.length - 1 ? (
                    <ArrowRight className="hidden h-8 w-8 shrink-0 text-homepage-border-strong lg:block" />
                  ) : null}
                </div>
              ))}
            </div>
          </motion.section>
      </div>
    </PublicPageLayout>
  );
}
