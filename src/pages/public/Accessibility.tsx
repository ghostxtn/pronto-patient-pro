import LocalizedContentPage, { type LocalizedPageContent } from "@/components/landing/LocalizedContentPage";
import { useLanguage } from "@/contexts/LanguageContext";

const contentByLanguage = {
  en: {
    eyebrow: "Accessibility",
    title: "Our accessibility commitment",
    description: "At MediBook, we aim to make our digital and physical services as accessible as possible.",
    sections: [
      {
        type: "list",
        title: "Physical Access",
        items: [
          "A step-free accessible entrance is available.",
          "Elevator access is provided.",
          "For additional access needs, contacting us in advance is recommended.",
        ],
      },
      {
        type: "text",
        title: "Digital Access",
        body: "We work to keep our website keyboard navigable, screen-reader compatible, and supported by sufficient color contrast. Accessibility improvements are an ongoing process.",
      },
      {
        type: "text",
        body: "If you would like to share accessibility feedback or report an issue you experienced, please contact us through our communication channels.",
        highlighted: true,
      },
    ],
  },
  tr: {
    eyebrow: "Erişilebilirlik",
    title: "Erişilebilirlik taahhüdümüz",
    description: "MediBook olarak dijital ve fiziksel hizmetlerimizin mümkün olduğunca erişilebilir olmasını hedefliyoruz.",
    sections: [
      {
        type: "list",
        title: "Fiziksel Erişim",
        items: [
          "Basamaksız (engelsiz) giriş mevcuttur.",
          "Asansör erişimi sağlanmaktadır.",
          "Ek erişim ihtiyaçları için önceden iletişime geçilmesi önerilir.",
        ],
      },
      {
        type: "text",
        title: "Dijital Erişim",
        body: "Web sitemizi klavye ile gezinilebilir, ekran okuyucu uyumlu ve yeterli renk kontrastı sağlayacak şekilde geliştirmeye çalışıyoruz. Erişilebilirlik iyileştirmeleri devam eden bir süreçtir.",
      },
      {
        type: "text",
        body: "Erişilebilirlik konusunda geri bildirimlerinizi veya yaşadığınız sorunları bizimle paylaşmak isterseniz lütfen iletişim kanallarımız üzerinden ulaşın.",
        highlighted: true,
      },
    ],
  },
  fr: {
    eyebrow: "Accessibilité",
    title: "Notre engagement en matière d'accessibilité",
    description: "Chez MediBook, nous cherchons à rendre nos services numériques et physiques aussi accessibles que possible.",
    sections: [
      {
        type: "list",
        title: "Accès physique",
        items: [
          "Une entrée sans marche est disponible.",
          "L'accès par ascenseur est assuré.",
          "Pour des besoins d'accès supplémentaires, il est recommandé de nous contacter à l'avance.",
        ],
      },
      {
        type: "text",
        title: "Accès numérique",
        body: "Nous travaillons à rendre notre site navigable au clavier, compatible avec les lecteurs d'écran et doté d'un contraste de couleurs suffisant. Les améliorations d'accessibilité se poursuivent en continu.",
      },
      {
        type: "text",
        body: "Si vous souhaitez partager un retour sur l'accessibilité ou signaler un problème rencontré, merci de nous contacter via nos canaux de communication.",
        highlighted: true,
      },
    ],
  },
  ru: {
    eyebrow: "Доступность",
    title: "Наше обязательство по доступности",
    description: "В MediBook мы стремимся сделать наши цифровые и физические услуги максимально доступными.",
    sections: [
      {
        type: "list",
        title: "Физический доступ",
        items: [
          "Доступен вход без ступеней.",
          "Предусмотрен доступ на лифте.",
          "При дополнительных потребностях в доступе рекомендуется связаться с нами заранее.",
        ],
      },
      {
        type: "text",
        title: "Цифровой доступ",
        body: "Мы стараемся, чтобы сайт был удобен для навигации с клавиатуры, совместим со скринридерами и имел достаточный цветовой контраст. Улучшение доступности - непрерывный процесс.",
      },
      {
        type: "text",
        body: "Если вы хотите поделиться отзывом о доступности или сообщить о возникшей проблеме, пожалуйста, свяжитесь с нами по нашим каналам связи.",
        highlighted: true,
      },
    ],
  },
  ar: {
    eyebrow: "إمكانية الوصول",
    title: "التزامنا بإمكانية الوصول",
    description: "في MediBook نهدف إلى جعل خدماتنا الرقمية والمادية متاحة قدر الإمكان.",
    sections: [
      {
        type: "list",
        title: "الوصول المادي",
        items: [
          "يتوفر مدخل خالٍ من الدرج.",
          "يتوفر الوصول عبر المصعد.",
          "يُنصح بالتواصل معنا مسبقًا عند وجود احتياجات وصول إضافية.",
        ],
      },
      {
        type: "text",
        title: "الوصول الرقمي",
        body: "نعمل على جعل موقعنا قابلًا للتنقل باستخدام لوحة المفاتيح ومتوافقًا مع قارئات الشاشة ومدعومًا بتباين ألوان كافٍ. تحسينات إمكانية الوصول عملية مستمرة.",
      },
      {
        type: "text",
        body: "إذا أردت مشاركة ملاحظات حول إمكانية الوصول أو الإبلاغ عن مشكلة واجهتها، يرجى التواصل معنا عبر قنوات الاتصال الخاصة بنا.",
        highlighted: true,
      },
    ],
  },
  es: {
    eyebrow: "Accesibilidad",
    title: "Nuestro compromiso con la accesibilidad",
    description: "En MediBook queremos que nuestros servicios digitales y físicos sean lo más accesibles posible.",
    sections: [
      {
        type: "list",
        title: "Acceso físico",
        items: [
          "Hay una entrada accesible sin escalones.",
          "Se ofrece acceso por ascensor.",
          "Para necesidades adicionales de acceso, se recomienda contactarnos con antelación.",
        ],
      },
      {
        type: "text",
        title: "Acceso digital",
        body: "Trabajamos para que nuestro sitio pueda recorrerse con teclado, sea compatible con lectores de pantalla y mantenga un contraste de color suficiente. Las mejoras de accesibilidad son un proceso continuo.",
      },
      {
        type: "text",
        body: "Si desea compartir comentarios sobre accesibilidad o informar de un problema, póngase en contacto con nosotros a través de nuestros canales de comunicación.",
        highlighted: true,
      },
    ],
  },
} satisfies Record<string, LocalizedPageContent>;

export default function Accessibility() {
  const { lang } = useLanguage();
  return <LocalizedContentPage content={contentByLanguage[lang]} />;
}
