import PublicPageLayout from "@/components/landing/PublicPageLayout";

export default function LegalKvkk() {
  return (
    <PublicPageLayout>
      <div className="container max-w-3xl">
        <section className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
            Yasal
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-5xl">
            KVKK Aydınlatma Metni
          </h1>
          <p className="mt-5 text-lg leading-8 text-homepage-text">
            6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma yükümlülüğümüze
            ilişkin bilgilendirme.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Veri Sorumlusu
          </h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            MediBook Sağlık Hizmetleri olarak kişisel verilerinizin güvenliği konusunda
            azami hassasiyet göstermekteyiz.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-display text-2xl tracking-tight text-homepage-ink">
            Kişisel Verilerin İşlenme Amaçları
          </h2>
          <p className="mt-4 text-base leading-7 text-homepage-text">
            Kişisel verileriniz; sağlık hizmetlerinin sunulması, randevu yönetimi, yasal
            yükümlülüklerin yerine getirilmesi ve hizmet kalitesinin artırılması amaçlarıyla
            işlenmektedir.
          </p>
        </section>

        <section className="rounded-2xl border border-homepage-border bg-homepage-shell-cool p-6">
          <p className="text-sm font-medium text-homepage-ink">
            Bu metin ara dönem bilgilendirme amaçlıdır.
          </p>
          <p className="mt-2 text-sm leading-7 text-homepage-text">
            Nihai KVKK aydınlatma metni, hukuki inceleme tamamlandığında bu sayfada
            yayınlanacaktır. Güncel haliyle kesin hukuki metin yerine geçmez.
          </p>
        </section>
      </div>
    </PublicPageLayout>
  );
}
