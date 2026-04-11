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
  logo_url?: string | null;
};

export default function ContactPage() {
  const { lang, t } = useLanguage();
  const previewData = useHomepagePreviewData(lang);
  const clinic = (previewData.data as { clinic?: ClinicContactRecord } | undefined)?.clinic;

  const clinicName = clinic?.name?.trim() || t.clinicFallbackName;
  const clinicAddress = clinic?.address?.trim() || t.clinicFallbackAddress;
  const clinicPhone = clinic?.phone?.trim() || "";
  const clinicEmail = clinic?.email?.trim() || t.clinicFallbackEmail;

  return (
    <PublicPageLayout>
      <div className="mx-auto max-w-[1200px] px-6 md:px-12 lg:px-20">
        <motion.section {...motionProps}>
          <h1 className="font-display text-4xl font-light tracking-tight text-homepage-ink md:text-5xl">
            {t.contactPageTitle}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-homepage-text md:text-lg">
            {t.contactPageDesc}
          </p>
        </motion.section>

        <motion.section {...motionProps} className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-homepage-border bg-homepage-shell p-8 md:p-10">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-homepage-brand">
              {t.clinicInfoTitle}
            </p>
            <h2 className="font-display mt-4 text-3xl font-light tracking-tight text-homepage-ink">
              {clinicName}
            </h2>

            <div className="mt-8 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-homepage-soft">{t.address}</p>
                <p className="mt-2 text-base leading-7 text-homepage-ink">{clinicAddress}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-homepage-soft">{t.phone}</p>
                <p className="mt-2 text-base leading-7 text-homepage-ink">{clinicPhone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-homepage-soft">{t.email}</p>
                <p className="mt-2 text-base leading-7 text-homepage-ink">{clinicEmail}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-[32px] bg-[linear-gradient(135deg,rgb(var(--homepage-brand)),rgb(var(--homepage-brand-deep)))] p-8 text-white shadow-[0_24px_64px_rgb(var(--homepage-brand-deep)/0.26)] md:p-10">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-white/70">
                {t.quickStart}
              </p>
              <h2 className="font-display mt-4 text-3xl font-light tracking-tight text-white">
                {t.bookNowTitle}
              </h2>
              <p className="mt-4 text-base leading-8 text-white/80">
                {t.bookNowDesc}
              </p>
            </div>

            <div className="mt-10">
              <SmartLink
                href="/auth"
                className="homepage-focus-inverse inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-homepage-brand-deep transition-transform duration-200 hover:translate-y-[-1px]"
              >
                {t.bookNowTitle}
              </SmartLink>
            </div>
          </div>
        </motion.section>
      </div>
    </PublicPageLayout>
  );
}
