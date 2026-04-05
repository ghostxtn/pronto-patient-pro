import { motion } from "framer-motion";
import PublicPageLayout from "@/components/landing/PublicPageLayout";
import SmartLink from "@/components/landing/SmartLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { useHomepagePreviewData } from "@/hooks/useHomepagePreviewData";

const motionProps = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, amount: 0.1 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

type ClinicContactRecord = {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
};

export default function ContactPage() {
  const { lang } = useLanguage();
  const previewData = useHomepagePreviewData(lang);
  const clinic = (previewData.data as { clinic?: ClinicContactRecord } | undefined)?.clinic;

  const clinicName = clinic?.name?.trim() || "MediBook Klinik";
  const clinicAddress = clinic?.address?.trim() || "Örnek Mahallesi, Sağlık Caddesi No:1, İstanbul";
  const clinicPhone = clinic?.phone?.trim() || "+90 (212) 000 00 00";
  const clinicEmail = clinic?.email?.trim() || "iletisim@medibook.clinic";

  return (
    <PublicPageLayout>
      <div className="mx-auto max-w-[1200px] px-6 md:px-12 lg:px-20">
          <motion.section {...motionProps}>
            <h1
              className="font-display text-4xl font-light tracking-tight text-homepage-ink md:text-5xl"
            >
              İletişim
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-homepage-text md:text-lg">
              Klinik iletişim bilgilerine tek yerden ulaşın ve uygun olduğunuzda randevu sürecini başlatın.
            </p>
          </motion.section>

          <motion.section
            {...motionProps}
            className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div className="rounded-[32px] border border-homepage-border bg-homepage-shell p-8 md:p-10">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-homepage-brand">
                Klinik Bilgileri
              </p>
              <h2 className="font-display mt-4 text-3xl font-light tracking-tight text-homepage-ink">
                {clinicName}
              </h2>

              <div className="mt-8 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-homepage-soft">Adres</p>
                  <p className="mt-2 text-base leading-7 text-homepage-ink">{clinicAddress}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-homepage-soft">Telefon</p>
                  <p className="mt-2 text-base leading-7 text-homepage-ink">{clinicPhone}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-homepage-soft">E-posta</p>
                  <p className="mt-2 text-base leading-7 text-homepage-ink">{clinicEmail}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[32px] bg-[linear-gradient(135deg,rgb(var(--homepage-brand)),rgb(var(--homepage-brand-deep)))] p-8 text-white shadow-[0_24px_64px_rgb(var(--homepage-brand-deep)/0.26)] md:p-10">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-white/70">
                  Hızlı Başlangıç
                </p>
                <h2 className="font-display mt-4 text-3xl font-light tracking-tight text-white">
                  Hemen Randevu Al
                </h2>
                <p className="mt-4 text-base leading-8 text-white/80">
                  Giriş yaparak veya hesap oluşturarak randevu talebinizi birkaç adımda iletebilirsiniz.
                </p>
              </div>

              <div className="mt-10">
                <SmartLink
                  href="/auth"
                  className="homepage-focus-inverse inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-homepage-brand-deep transition-transform duration-200 hover:translate-y-[-1px]"
                >
                  Hemen Randevu Al
                </SmartLink>
              </div>
            </div>
          </motion.section>
      </div>
    </PublicPageLayout>
  );
}
