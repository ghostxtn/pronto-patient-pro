import PublicPageLayout from "@/components/landing/PublicPageLayout";

export default function LegalDataSubject() {
  return (
    <PublicPageLayout>
      <div className="container max-w-3xl">
        <section className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
            Yasal
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-5xl">
            Veri Sahibi Başvuru Formu
          </h1>
          <p className="mt-5 text-lg leading-8 text-homepage-text">
            6698 sayılı KVKK kapsamında veri sahibi olarak haklarınızı kullanmak için
            başvuru bilgileri.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Başvuru Hakkınız
          </h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            KVKK'nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini
            öğrenme, düzeltilmesini veya silinmesini talep etme ve itiraz haklarınız
            bulunmaktadır.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Başvuru Yöntemi
          </h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            Başvurularınızı yazılı olarak veya iletişim sayfamızda belirtilen e-posta adresi
            üzerinden iletebilirsiniz. Başvurunuz en geç 30 gün içinde yanıtlanacaktır.
          </p>
        </section>

        <section className="rounded-2xl border border-homepage-border bg-homepage-shell-cool p-6">
          <p className="text-sm font-medium text-homepage-ink">
            Bu metin ara dönem bilgilendirme amaçlıdır.
          </p>
          <p className="mt-2 text-sm leading-7 text-homepage-text">
            Nihai veri sahibi başvuru süreci ve formu hukuki inceleme tamamlandığında
            bu sayfada yayınlanacaktır.
          </p>
        </section>
      </div>
    </PublicPageLayout>
  );
}
