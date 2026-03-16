import PublicPageLayout from "@/components/landing/PublicPageLayout";
import SmartLink from "@/components/landing/SmartLink";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WhyMedibook() {
  return (
    <PublicPageLayout>
      <div className="container max-w-3xl">
        <section className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
            Yaklaşımımız
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-5xl">
            Neden bu klinikte süreç böyle işliyor?
          </h1>
          <p className="mt-5 text-lg leading-8 text-homepage-text">
            MediBook, hızlı randevu vaatleri yerine doğru uzmanlık eşlemesini ve düzenli hasta
            iletişimini önceleyen bir klinik yaklaşımı benimser.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Neyi farklı yapıyoruz?
          </h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            Randevu talebiniz otomatik bir onay mekanizmasından geçmez. Klinik ekibi ihtiyacınızı
            değerlendirir, uygun uzmanlığı belirler ve süreci sizinle birlikte netleştirir. Bu
            yaklaşım, hız yerine doğru yönlendirmeyi önceler.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Neden bu yaklaşım?
          </h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            Bir klinikte en kritik adım doğru uzmanlıkla eşleşmektir. Otomatik onay sistemleri
            hız kazandırsa da yanlış yönlendirme riskini artırır. Koordinasyon destekli bir süreç,
            hastanın ihtiyacına daha uygun bir başlangıç sağlar.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Hasta açısından ne değişir?
          </h2>
          <ul className="mt-4 space-y-3">
            <li className="flex gap-3 text-base leading-7 text-homepage-text">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Talebiniz gerçek bir klinik değerlendirmeden geçer.</span>
            </li>
            <li className="flex gap-3 text-base leading-7 text-homepage-text">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Sürecin her adımında bilgilendirilirsiniz.</span>
            </li>
            <li className="flex gap-3 text-base leading-7 text-homepage-text">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Doktor tercihiniz mümkün olduğunca dikkate alınır, ancak garanti verilmez.</span>
            </li>
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
            <SmartLink href="/appointment-process">Randevu Sürecini Gör</SmartLink>
          </Button>
        </div>
      </div>
    </PublicPageLayout>
  );
}
