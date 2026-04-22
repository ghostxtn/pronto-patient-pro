import LocalizedContentPage, { type LocalizedPageContent } from "@/components/landing/LocalizedContentPage";
import { useLanguage } from "@/contexts/LanguageContext";

const contentByLanguage = {
  en: {
    eyebrow: "Legal",
    title: "Cookie Policy",
    description: "Information about the cookies used on the MediBook website and how they are managed.",
    sections: [
      { type: "text", title: "Cookie Use", body: "Our website uses essential cookies for session management and core functionality. If analytics or marketing cookies are introduced, additional notice will be provided." },
      { type: "text", body: "This text is for interim information purposes. The final cookie policy will be published on this page after legal review is completed.", highlighted: true },
    ],
  },
  tr: {
    eyebrow: "Yasal",
    title: "Çerez Politikası",
    description: "MediBook web sitesinde kullanılan çerezler ve bunların yönetimi hakkında bilgilendirme.",
    sections: [
      { type: "text", title: "Çerez Kullanımı", body: "Sitemizde oturum yönetimi ve temel işlevsellik için zorunlu çerezler kullanılmaktadır. Analitik veya pazarlama amaçlı çerez kullanımı durumunda ayrıca bilgilendirme yapılacaktır." },
      { type: "text", body: "Bu metin ara dönem bilgilendirme amaçlıdır. Nihai çerez politikası hukuki inceleme tamamlandığında bu sayfada yayınlanacaktır.", highlighted: true },
    ],
  },
  fr: {
    eyebrow: "Mentions légales",
    title: "Politique des cookies",
    description: "Informations sur les cookies utilisés sur le site MediBook et sur leur gestion.",
    sections: [
      { type: "text", title: "Utilisation des cookies", body: "Notre site utilise des cookies strictement nécessaires pour la gestion de session et les fonctions essentielles. Si des cookies analytiques ou marketing sont ajoutés, une information complémentaire sera fournie." },
      { type: "text", body: "Ce texte est fourni à titre transitoire. La politique des cookies définitive sera publiée sur cette page une fois l'examen juridique terminé.", highlighted: true },
    ],
  },
  ru: {
    eyebrow: "Правовая информация",
    title: "Политика файлов cookie",
    description: "Информация о файлах cookie, используемых на сайте MediBook, и о порядке их управления.",
    sections: [
      { type: "text", title: "Использование cookie", body: "На сайте используются обязательные cookie для управления сессией и основной функциональности. Если будут внедрены аналитические или маркетинговые cookie, будет опубликовано дополнительное уведомление." },
      { type: "text", body: "Этот текст носит временный информационный характер. Окончательная политика файлов cookie будет опубликована на этой странице после завершения юридической проверки.", highlighted: true },
    ],
  },
  ar: {
    eyebrow: "قانوني",
    title: "سياسة ملفات تعريف الارتباط",
    description: "معلومات حول ملفات تعريف الارتباط المستخدمة في موقع MediBook وكيفية إدارتها.",
    sections: [
      { type: "text", title: "استخدام ملفات تعريف الارتباط", body: "يستخدم موقعنا ملفات تعريف ارتباط أساسية لإدارة الجلسة وتقديم الوظائف الأساسية. وإذا تم استخدام ملفات تعريف ارتباط تحليلية أو تسويقية فسيتم تقديم إشعار إضافي بذلك." },
      { type: "text", body: "هذا النص مخصص للمعلومات المؤقتة. سيتم نشر سياسة ملفات تعريف الارتباط النهائية على هذه الصفحة بعد اكتمال المراجعة القانونية.", highlighted: true },
    ],
  },
  es: {
    eyebrow: "Legal",
    title: "Política de cookies",
    description: "Información sobre las cookies utilizadas en el sitio web de MediBook y cómo se gestionan.",
    sections: [
      { type: "text", title: "Uso de cookies", body: "Nuestro sitio utiliza cookies esenciales para la gestión de sesiones y la funcionalidad básica. Si se introducen cookies analíticas o de marketing, se proporcionará información adicional." },
      { type: "text", body: "Este texto tiene carácter informativo provisional. La política de cookies definitiva se publicará en esta página cuando finalice la revisión legal.", highlighted: true },
    ],
  },
} satisfies Record<string, LocalizedPageContent>;

export default function LegalCookiePolicy() {
  const { lang } = useLanguage();
  return <LocalizedContentPage content={contentByLanguage[lang]} />;
}
