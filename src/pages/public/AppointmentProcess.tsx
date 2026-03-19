import PublicPageLayout from "@/components/landing/PublicPageLayout";
import SmartLink from "@/components/landing/SmartLink";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppointmentProcess() {
  return (
    <PublicPageLayout>
      <div className="container max-w-3xl">
        <section className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
            Randevu Süreci
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-5xl">
            Randevu talebinden takibe: süreç nasıl işler?
          </h1>
          <p className="mt-5 text-lg leading-8 text-homepage-text">
            Bu sayfa randevu sürecinin her adımını açıklar. Amaç hız vaadi değil, doğru uzmanlık
            eşlemesi ve düzenli iletişimdir.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Süreç neden böyle?
          </h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            Otomatik onay yerine koordinasyon destekli bir akış tercih ediyoruz. Talebiniz klinik
            ekibi tarafından değerlendirilir ve doğru uzmanlığa yönlendirilir. Bu yaklaşım
            yanlış yönlendirme riskini azaltır.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            3 Adım
          </h2>
          <div className="mt-6 space-y-6">
            <div className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-homepage-border-strong bg-white text-sm font-semibold text-homepage-brand">
                01
              </span>
              <div>
                <h3 className="font-display text-lg text-homepage-ink">Talep Oluşturun</h3>
                <p className="mt-1 text-sm leading-7 text-homepage-text">
                  İhtiyacınızı ve varsa tercihlerinizi kısa bir form aracılığıyla paylaşın.
                  Bu aşamada herhangi bir onay verilmez.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-homepage-border-strong bg-white text-sm font-semibold text-homepage-brand">
                02
              </span>
              <div>
                <h3 className="font-display text-lg text-homepage-ink">Değerlendirme ve Yönlendirme</h3>
                <p className="mt-1 text-sm leading-7 text-homepage-text">
                  Klinik ekibi talebinizi inceler, uygun uzmanlık alanını ve doktor hattını
                  belirler. Doktor tercihiniz değerlendirilir ancak garanti kapsamında değildir.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-homepage-border-strong bg-white text-sm font-semibold text-homepage-brand">
                03
              </span>
              <div>
                <h3 className="font-display text-lg text-homepage-ink">Onay ve Takip</h3>
                <p className="mt-1 text-sm leading-7 text-homepage-text">
                  Uygun yönlendirme sonrası süreç netleştirilir. Tarih, saat ve hazırlık
                  bilgileri sizinle paylaşılır.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-10 rounded-2xl border border-homepage-border bg-homepage-shell-cool p-6">
          <h2 className="font-display text-xl tracking-tight text-homepage-ink">
            Önemli Notlar
          </h2>
          <ul className="mt-4 space-y-2 text-sm leading-7 text-homepage-text">
            <li>• Bu sistem acil durum kanalı değildir. Acil sağlık ihtiyaçları için 112'yi arayın.</li>
            <li>• Geri dönüş süresi klinik yoğunluğuna göre değişebilir.</li>
            <li>• Doktor tercihi değerlendirmeye bağlıdır, garanti değildir.</li>
          </ul>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            className="homepage-focus-soft h-11 rounded-full border border-homepage-brand bg-homepage-brand px-5 text-sm text-white hover:bg-homepage-brand-deep"
          >
            <SmartLink href="/request-appointment">
              Randevu Talebi Oluştur <ArrowRight className="h-4 w-4" />
            </SmartLink>
          </Button>
          <Button
            variant="outline"
            asChild
            className="homepage-focus-soft h-11 rounded-full border-homepage-border-strong bg-transparent px-5 text-sm text-homepage-muted hover:bg-homepage-shell-cool hover:text-homepage-ink"
          >
            <SmartLink href="/contact">İletişim</SmartLink>
          </Button>
        </div>
      </div>
    </PublicPageLayout>
  );
}
