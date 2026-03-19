import PublicPageLayout from "@/components/landing/PublicPageLayout";

export default function Accessibility() {
  return (
    <PublicPageLayout>
      <div className="container max-w-3xl">
        <section className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
            Erişilebilirlik
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-5xl">
            Erişilebilirlik taahhüdümüz
          </h1>
          <p className="mt-5 text-lg leading-8 text-homepage-text">
            MediBook olarak dijital ve fiziksel hizmetlerimizin mümkün olduğunca erişilebilir
            olmasını hedefliyoruz.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Fiziksel Erişim
          </h2>
          <ul className="mt-4 space-y-2 text-base leading-7 text-homepage-text">
            <li className="flex gap-3">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Basamaksız (engelsiz) giriş mevcuttur.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Asansör erişimi sağlanmaktadır.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Ek erişim ihtiyaçları için önceden iletişime geçilmesi önerilir.</span>
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Dijital Erişim
          </h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            Web sitemizi klavye ile gezinilebilir, ekran okuyucu uyumlu ve yeterli renk kontrastı
            sağlayacak şekilde geliştirmeye çalışıyoruz. Erişilebilirlik iyileştirmeleri
            devam eden bir süreçtir.
          </p>
        </section>

        <section className="rounded-2xl border border-homepage-border bg-homepage-shell-cool p-6">
          <p className="text-sm leading-7 text-homepage-text">
            Erişilebilirlik konusunda geri bildirimlerinizi veya yaşadığınız sorunları bizimle
            paylaşmak isterseniz lütfen iletişim kanallarımız üzerinden ulaşın.
          </p>
        </section>
      </div>
    </PublicPageLayout>
  );
}
