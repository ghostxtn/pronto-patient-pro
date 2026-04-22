import LocalizedContentPage, { type LocalizedPageContent } from "@/components/landing/LocalizedContentPage";
import { useLanguage } from "@/contexts/LanguageContext";

const contentByLanguage = {
  en: {
    eyebrow: "Legal",
    title: "Terms of Use",
    description: "Information about the conditions that apply when using the MediBook website.",
    sections: [
      { type: "text", title: "Scope of Use", body: "This website is operated to provide information about MediBook clinic services and to allow users to create appointment requests. The site content is for informational purposes." },
      { type: "text", title: "Limitations of Liability", body: "Information provided through the site does not constitute medical advice. Creating an appointment request does not mean automatic approval or commitment." },
      { type: "text", body: "This text is for interim information purposes. The final terms of use will be published on this page after legal review is completed.", highlighted: true },
    ],
  },
  tr: {
    eyebrow: "Yasal",
    title: "Kullanım Koşulları",
    description: "MediBook web sitesini kullanırken geçerli olan koşullar hakkında bilgilendirme.",
    sections: [
      { type: "text", title: "Kullanım Kapsamı", body: "Bu web sitesi MediBook klinik hizmetleri hakkında bilgi sunmak ve randevu talebi oluşturma imkânı sağlamak amacıyla işletilmektedir. Sitedeki içerikler bilgilendirme amaçlıdır." },
      { type: "text", title: "Sorumluluk Sınırları", body: "Site üzerinden sağlanan bilgiler tıbbi tavsiye niteliği taşımaz. Randevu talebi oluşturmak otomatik onay veya taahhüt anlamına gelmez." },
      { type: "text", body: "Bu metin ara dönem bilgilendirme amaçlıdır. Nihai kullanım koşulları hukuki inceleme tamamlandığında bu sayfada yayınlanacaktır.", highlighted: true },
    ],
  },
  fr: {
    eyebrow: "Mentions légales",
    title: "Conditions d'utilisation",
    description: "Informations sur les conditions applicables lors de l'utilisation du site MediBook.",
    sections: [
      { type: "text", title: "Champ d'utilisation", body: "Ce site est exploité pour fournir des informations sur les services de la clinique MediBook et permettre la création de demandes de rendez-vous. Le contenu du site a un objectif informatif." },
      { type: "text", title: "Limites de responsabilité", body: "Les informations fournies sur le site ne constituent pas un avis médical. Le fait de créer une demande de rendez-vous ne signifie pas une approbation automatique ni un engagement." },
      { type: "text", body: "Ce texte est fourni à titre transitoire. Les conditions d'utilisation définitives seront publiées sur cette page une fois l'examen juridique terminé.", highlighted: true },
    ],
  },
  ru: {
    eyebrow: "Правовая информация",
    title: "Условия использования",
    description: "Информация об условиях, действующих при использовании сайта MediBook.",
    sections: [
      { type: "text", title: "Объем использования", body: "Этот сайт работает для предоставления информации об услугах клиники MediBook и возможности создавать запросы на прием. Содержимое сайта носит информационный характер." },
      { type: "text", title: "Ограничение ответственности", body: "Информация, размещенная на сайте, не является медицинской консультацией. Создание запроса на прием не означает автоматического подтверждения или обязательства." },
      { type: "text", body: "Этот текст носит временный информационный характер. Окончательные условия использования будут опубликованы на этой странице после завершения юридической проверки.", highlighted: true },
    ],
  },
  ar: {
    eyebrow: "قانوني",
    title: "شروط الاستخدام",
    description: "معلومات حول الشروط السارية عند استخدام موقع MediBook.",
    sections: [
      { type: "text", title: "نطاق الاستخدام", body: "يتم تشغيل هذا الموقع لتقديم معلومات عن خدمات عيادة MediBook ولإتاحة إنشاء طلبات المواعيد. ويُقصد بمحتوى الموقع أغراض إعلامية." },
      { type: "text", title: "حدود المسؤولية", body: "المعلومات المقدمة عبر الموقع لا تشكل نصيحة طبية. كما أن إنشاء طلب موعد لا يعني موافقة تلقائية أو التزامًا." },
      { type: "text", body: "هذا النص مخصص للمعلومات المؤقتة. سيتم نشر شروط الاستخدام النهائية على هذه الصفحة بعد اكتمال المراجعة القانونية.", highlighted: true },
    ],
  },
  es: {
    eyebrow: "Legal",
    title: "Términos de uso",
    description: "Información sobre las condiciones aplicables al utilizar el sitio web de MediBook.",
    sections: [
      { type: "text", title: "Alcance del uso", body: "Este sitio web funciona para ofrecer información sobre los servicios clínicos de MediBook y permitir crear solicitudes de cita. El contenido del sitio tiene fines informativos." },
      { type: "text", title: "Limitaciones de responsabilidad", body: "La información proporcionada en el sitio no constituye asesoramiento médico. Crear una solicitud de cita no significa aprobación automática ni compromiso." },
      { type: "text", body: "Este texto tiene carácter informativo provisional. Los términos de uso definitivos se publicarán en esta página cuando finalice la revisión legal.", highlighted: true },
    ],
  },
} satisfies Record<string, LocalizedPageContent>;

export default function LegalTermsOfUse() {
  const { lang } = useLanguage();
  return <LocalizedContentPage content={contentByLanguage[lang]} />;
}
