import PublicPageLayout from "@/components/landing/PublicPageLayout";

export default function LegalMedicalDisclaimer() {
  return (
    <PublicPageLayout>
      <div className="container max-w-3xl">
        <section className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
            Yasal
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-5xl">
            Tıbbi Bilgilendirme
          </h1>
          <p className="mt-5 text-lg leading-8 text-homepage-text">
            Bu web sitesinde yer alan içerikler hakkında önemli bilgilendirme.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Genel Bilgilendirme
          </h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            Bu web sitesindeki içerikler genel bilgilendirme amaçlıdır ve tıbbi tavsiye,
            teşhis veya tedavi yerine geçmez. Sağlık sorunlarınız için mutlaka bir
            sağlık profesyoneline başvurun.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Acil Durumlar
          </h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            Acil sağlık durumlarında bu web sitesini kullanmayın. Acil yardım için 112'yi
            arayın veya en yakın acil servise başvurun.
          </p>
        </section>

        <section className="rounded-2xl border border-homepage-border bg-homepage-shell-cool p-6">
          <p className="text-sm font-medium text-homepage-ink">
            Bu metin ara dönem bilgilendirme amaçlıdır.
          </p>
          <p className="mt-2 text-sm leading-7 text-homepage-text">
            Nihai tıbbi bilgilendirme metni hukuki inceleme tamamlandığında bu sayfada
            yayınlanacaktır.
          </p>
        </section>
      </div>
    </PublicPageLayout>
  );
}
