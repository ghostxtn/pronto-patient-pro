import PublicPageLayout from "@/components/landing/PublicPageLayout";

export default function LegalTermsOfUse() {
  return (
    <PublicPageLayout>
      <div className="container max-w-3xl">
        <section className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
            Yasal
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-5xl">
            Kullanım Koşulları
          </h1>
          <p className="mt-5 text-lg leading-8 text-homepage-text">
            MediBook web sitesini kullanırken geçerli olan koşullar hakkında bilgilendirme.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Kullanım Kapsamı
          </h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            Bu web sitesi MediBook klinik hizmetleri hakkında bilgi sunmak ve randevu
            talebi oluşturma imkânı sağlamak amacıyla işletilmektedir. Sitedeki içerikler
            bilgilendirme amaçlıdır.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Sorumluluk Sınırları
          </h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            Site üzerinden sağlanan bilgiler tıbbi tavsiye niteliği taşımaz. Randevu talebi
            oluşturmak otomatik onay veya taahhüt anlamına gelmez.
          </p>
        </section>

        <section className="rounded-2xl border border-homepage-border bg-homepage-shell-cool p-6">
          <p className="text-sm font-medium text-homepage-ink">
            Bu metin ara dönem bilgilendirme amaçlıdır.
          </p>
          <p className="mt-2 text-sm leading-7 text-homepage-text">
            Nihai kullanım koşulları hukuki inceleme tamamlandığında bu sayfada
            yayınlanacaktır.
          </p>
        </section>
      </div>
    </PublicPageLayout>
  );
}
