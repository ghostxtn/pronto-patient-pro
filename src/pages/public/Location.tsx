import PublicPageLayout from "@/components/landing/PublicPageLayout";
import SmartLink from "@/components/landing/SmartLink";
import { Button } from "@/components/ui/button";

export default function Location() {
  return (
    <PublicPageLayout>
      <div className="container max-w-3xl">
        <section className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
            Adres ve Ulaşım
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-5xl">
            Kliniğe nasıl gelirsiniz?
          </h1>
          <p className="mt-5 text-lg leading-8 text-homepage-text">
            Adres, toplu taşıma bilgisi ve fiziksel erişim detayları.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">Adres</h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            Örnek Mahallesi, Sağlık Caddesi No:1, Beşiktaş / İstanbul
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Ulaşım Bilgisi
          </h2>
          <ul className="mt-4 space-y-2 text-base leading-7 text-homepage-text">
            <li className="flex gap-3">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Metro: En yakın istasyon bilgisi güncellenecektir.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Otobüs: İlgili hat bilgisi güncellenecektir.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Otopark: Bina girişinde sınırlı otopark alanı mevcuttur.</span>
            </li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Çalışma Saatleri
          </h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            Hafta içi 09:00 – 18:00 · Cumartesi 09:00 – 14:00 · Pazar kapalı
          </p>
        </section>

        <section className="mb-10 rounded-2xl border border-homepage-border bg-homepage-shell-cool p-6">
          <h2 className="font-display text-xl tracking-tight text-homepage-ink">
            Erişilebilirlik
          </h2>
          <p className="mt-3 text-sm leading-7 text-homepage-text">
            Klinik girişi basamaksız (engelsiz) erişime uygundur. Asansör mevcuttur.
            Ek erişim ihtiyaçlarınız için lütfen önceden iletişime geçin.
          </p>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            asChild
            className="homepage-focus-soft h-11 rounded-full border-homepage-border-strong bg-transparent px-5 text-sm text-homepage-muted hover:bg-homepage-shell-cool hover:text-homepage-ink"
          >
            <SmartLink href="/contact">İletişim</SmartLink>
          </Button>
          <Button
            variant="outline"
            asChild
            className="homepage-focus-soft h-11 rounded-full border-homepage-border-strong bg-transparent px-5 text-sm text-homepage-muted hover:bg-homepage-shell-cool hover:text-homepage-ink"
          >
            <SmartLink href="/appointment-process">Randevu Sürecini Gör</SmartLink>
          </Button>
        </div>
      </div>
    </PublicPageLayout>
  );
}
