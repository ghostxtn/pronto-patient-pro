import PublicPageLayout from "@/components/landing/PublicPageLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqGroups = [
  {
    title: "Randevu Süreci",
    items: [
      {
        q: "Randevu talebi nasıl oluşturulur?",
        a: "Ana talep akışı üzerinden temel bilgilerinizi ve ihtiyacınızı paylaşmanız yeterlidir. Klinik ekibi uygun yönlendirme için talebi değerlendirir.",
      },
      {
        q: "Talebime ne kadar sürede dönüş yapılır?",
        a: "Geri dönüş süresi klinik yoğunluğuna göre değişebilir. Amaç otomatik hız vaadi değil, doğru uzmanlık eşlemesiyle net bilgilendirme sağlamaktır.",
      },
      {
        q: "İptal veya erteleme nasıl işler?",
        a: "İptal ya da erteleme talepleri klinik koordinasyonu üzerinden yürütülür. Uygun yeni zaman planı için sizinle yeniden iletişime geçilir.",
      },
    ],
  },
  {
    title: "Doktor ve Uzmanlık",
    items: [
      {
        q: "Doktor seçebilir miyim?",
        a: "Uygun olduğu durumlarda hekim tercihinizi belirtebilirsiniz. Klinik ekibi, ihtiyacınız ve mevcut planlamaya göre en doğru yönlendirmeyi yapar.",
      },
      {
        q: "Hangi uzmanlık alanlarında hizmet veriyorsunuz?",
        a: "Güncel uzmanlık alanlarımızı Uzmanlık Alanları sayfamızdan inceleyebilirsiniz.",
      },
    ],
  },
  {
    title: "İletişim ve Ziyaret",
    items: [
      {
        q: "Klinik çalışma saatleri nedir?",
        a: "Hafta içi 09:00 – 18:00, Cumartesi 09:00 – 14:00. Pazar günleri kapalıyız.",
      },
      {
        q: "Kliniğe nasıl ulaşabilirim?",
        a: "Adres ve ulaşım bilgileri için Adres ve Ulaşım sayfamızı ziyaret edebilirsiniz.",
      },
    ],
  },
  {
    title: "Gizlilik ve Veri",
    items: [
      {
        q: "Kişisel verilerim nasıl korunuyor?",
        a: "Kişisel verileriniz KVKK kapsamında işlenmektedir. Detaylı bilgi için KVKK Aydınlatma sayfamızı inceleyebilirsiniz.",
      },
      {
        q: "Veri sahibi başvurusu nasıl yapılır?",
        a: "Veri sahibi haklarınızı kullanmak için Veri Sahibi Başvuru sayfamızdaki bilgilendirmeyi takip edebilirsiniz.",
      },
    ],
  },
];

export default function Faq() {
  return (
    <PublicPageLayout>
      <div className="container max-w-3xl">
        <section className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-homepage-soft">
            Sık Sorulan Sorular
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-homepage-ink md:text-5xl">
            Merak edilen konular
          </h1>
          <p className="mt-5 text-lg leading-8 text-homepage-text">
            Randevu sürecinden gizlilik konularına kadar en sık sorulan soruları gruplandırdık.
          </p>
        </section>

        {faqGroups.map((group) => (
          <section key={group.title} className="mb-10">
            <h2 className="mb-4 font-display text-2xl tracking-tight text-homepage-ink">
              {group.title}
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {group.items.map((item, index) => (
                <AccordionItem
                  key={item.q}
                  value={`${group.title}-${index}`}
                  className="border-homepage-border"
                >
                  <AccordionTrigger className="text-left font-display text-base leading-7 text-homepage-ink hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-7 text-homepage-text">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))}
      </div>
    </PublicPageLayout>
  );
}
