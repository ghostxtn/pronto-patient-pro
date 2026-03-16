import PublicPageLayout from "@/components/landing/PublicPageLayout";
import SmartLink from "@/components/landing/SmartLink";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Contact() {
  return (
    <PublicPageLayout>
      <div className="container max-w-3xl">
        <section className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
            İletişim
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-5xl">
            Kliniğe nasıl ulaşabilirsiniz?
          </h1>
          <p className="mt-5 text-lg leading-8 text-homepage-text">
            İletişim kanalları, çalışma bilgileri ve hangi konularda bize ulaşabileceğiniz
            burada özetlenmiştir.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            İletişim Yolları
          </h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-homepage-border bg-white/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-homepage-soft">Telefon</p>
              <p className="mt-1 text-base font-medium text-homepage-ink">+90 (212) 000 00 00</p>
            </div>
            <div className="rounded-2xl border border-homepage-border bg-white/80 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-homepage-soft">E-posta</p>
              <p className="mt-1 text-base font-medium text-homepage-ink">iletisim@medibook.clinic</p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Çalışma Bilgisi
          </h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            Hafta içi 09:00 – 18:00 · Cumartesi 09:00 – 14:00 · Pazar kapalı
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Hangi konular için ulaşabilirsiniz?
          </h2>
          <ul className="mt-4 space-y-2 text-base leading-7 text-homepage-text">
            <li className="flex gap-3">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Randevu talebi ve takip süreçleri</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Genel bilgi ve yönlendirme</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-homepage-brand" />
              <span>Veri sahibi başvuruları ve KVKK talepleri</span>
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
            <SmartLink href="/location">Adres ve Ulaşım</SmartLink>
          </Button>
        </div>
      </div>
    </PublicPageLayout>
  );
}
