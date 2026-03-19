import PublicPageLayout from "@/components/landing/PublicPageLayout";
import SmartLink from "@/components/landing/SmartLink";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <PublicPageLayout>
      <div className="container max-w-3xl">
        <section className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
            Hakkımızda
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-5xl">
            Biz nasıl bir kliniğiz?
          </h1>
          <p className="mt-5 text-lg leading-8 text-homepage-text">
            MediBook, koordinasyon odaklı bir klinik yapısı içinde hasta bakımını düzenleyen tek
            merkezli bir sağlık kuruluşudur.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Çalışma Yaklaşımımız
          </h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            Hasta sürecini ilk talepten takibe kadar tek bir koordinasyon yapısı içinde yönetiyoruz.
            Klinik ekibi, her talebi değerlendirerek uygun uzmanlığa yönlendirme yapar.
            Amaç hız değil, doğru başlangıç ve düzenli iletişimdir.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Ekip ve Yapı
          </h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            Hekim kadrosu, koordinasyon ekibi ve hasta iletişim birimi birlikte çalışır.
            Her uzmanlık alanı kendi klinik sürecini yönetirken, genel koordinasyon merkezi
            akışı birleştirir.
          </p>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            className="homepage-focus-soft h-11 rounded-full border border-homepage-brand bg-homepage-brand px-5 text-sm text-white hover:bg-homepage-brand-deep"
          >
            <SmartLink href="/doctors">
              Doktorlarımızı Gör <ArrowRight className="h-4 w-4" />
            </SmartLink>
          </Button>
          <Button
            variant="outline"
            asChild
            className="homepage-focus-soft h-11 rounded-full border-homepage-border-strong bg-transparent px-5 text-sm text-homepage-muted hover:bg-homepage-shell-cool hover:text-homepage-ink"
          >
            <SmartLink href="/why-medibook">Yaklaşımımızı Gör</SmartLink>
          </Button>
        </div>
      </div>
    </PublicPageLayout>
  );
}
