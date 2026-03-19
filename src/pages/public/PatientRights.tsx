import PublicPageLayout from "@/components/landing/PublicPageLayout";

export default function PatientRights() {
  return (
    <PublicPageLayout>
      <div className="container max-w-3xl">
        <section className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
            Hasta Hakları
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-5xl">
            Hasta hakları ve beklentiler
          </h1>
          <p className="mt-5 text-lg leading-8 text-homepage-text">
            Kliniğimizde tedavi sürecindeki haklarınız ve karşılıklı beklentiler hakkında
            temel bilgiler.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Temel Hasta Hakları
          </h2>
          <ul className="mt-4 space-y-3 text-base leading-7 text-homepage-text">
            <li className="flex gap-3">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Sağlık hizmetlerinden eşit şekilde yararlanma hakkı.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Bilgilendirilme ve tedavi süreçleri hakkında açıklama isteme hakkı.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Kişisel verilerin korunması ve gizlilik hakkı.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Tedaviyi kabul etme veya reddetme hakkı.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Şikâyet ve öneri bildirme hakkı.</span>
            </li>
          </ul>
        </section>

        <section className="mb-10 rounded-2xl border border-homepage-border bg-homepage-shell-cool p-6">
          <p className="text-sm leading-7 text-homepage-text">
            Bu sayfa genel bilgilendirme amaçlıdır ve hukuki tavsiye niteliği taşımaz.
            Detaylı bilgi için Sağlık Bakanlığı Hasta Hakları Yönetmeliği'ne başvurabilirsiniz.
          </p>
        </section>
      </div>
    </PublicPageLayout>
  );
}
