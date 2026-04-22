import LocalizedContentPage, { type LocalizedPageContent } from "@/components/landing/LocalizedContentPage";
import { useLanguage } from "@/contexts/LanguageContext";

const contentByLanguage = {
  en: {
    eyebrow: "Legal",
    title: "Privacy Policy",
    description: "MediBook's privacy policy explains how your personal data are collected, processed, and protected.",
    sections: [
      { type: "text", title: "Collected Data", body: "Appointment requests, contact details, and site usage data are collected for service delivery purposes." },
      { type: "text", title: "Protection of Data", body: "Your personal data are protected through technical and administrative safeguards and are shared with third parties only within the scope of legal obligations." },
      { type: "text", body: "This text is for interim information purposes. The final privacy policy will be published on this page after legal review is completed.", highlighted: true },
    ],
  },
  tr: {
    eyebrow: "Yasal",
    title: "Gizlilik Politikası",
    description: "MediBook gizlilik politikası, kişisel verilerinizin nasıl toplandığı, işlendiği ve korunduğu hakkında bilgi verir.",
    sections: [
      { type: "text", title: "Toplanan Veriler", body: "Randevu talepleri, iletişim bilgileri ve site kullanım verileri hizmet sunumu amacıyla toplanmaktadır." },
      { type: "text", title: "Verilerin Korunması", body: "Kişisel verileriniz teknik ve idari tedbirlerle korunmakta olup üçüncü taraflarla yalnızca yasal zorunluluklar çerçevesinde paylaşılmaktadır." },
      { type: "text", body: "Bu metin ara dönem bilgilendirme amaçlıdır. Nihai gizlilik politikası hukuki inceleme tamamlandığında bu sayfada yayınlanacaktır.", highlighted: true },
    ],
  },
  fr: {
    eyebrow: "Mentions légales",
    title: "Politique de confidentialité",
    description: "La politique de confidentialité de MediBook explique comment vos données personnelles sont collectées, traitées et protégées.",
    sections: [
      { type: "text", title: "Données collectées", body: "Les demandes de rendez-vous, les coordonnées et les données d'utilisation du site sont collectées pour permettre la fourniture des services." },
      { type: "text", title: "Protection des données", body: "Vos données personnelles sont protégées par des mesures techniques et administratives et ne sont partagées avec des tiers que dans le cadre d'obligations légales." },
      { type: "text", body: "Ce texte est fourni à titre transitoire. La politique de confidentialité définitive sera publiée sur cette page une fois l'examen juridique terminé.", highlighted: true },
    ],
  },
  ru: {
    eyebrow: "Правовая информация",
    title: "Политика конфиденциальности",
    description: "Политика конфиденциальности MediBook объясняет, как собираются, обрабатываются и защищаются ваши персональные данные.",
    sections: [
      { type: "text", title: "Собираемые данные", body: "Запросы на прием, контактные данные и данные об использовании сайта собираются для предоставления услуг." },
      { type: "text", title: "Защита данных", body: "Ваши персональные данные защищены техническими и административными мерами и передаются третьим лицам только в рамках требований законодательства." },
      { type: "text", body: "Этот текст носит временный информационный характер. Окончательная политика конфиденциальности будет опубликована на этой странице после завершения юридической проверки.", highlighted: true },
    ],
  },
  ar: {
    eyebrow: "قانوني",
    title: "سياسة الخصوصية",
    description: "توضح سياسة الخصوصية الخاصة بـ MediBook كيفية جمع بياناتك الشخصية ومعالجتها وحمايتها.",
    sections: [
      { type: "text", title: "البيانات التي يتم جمعها", body: "يتم جمع طلبات المواعيد وبيانات الاتصال وبيانات استخدام الموقع لأغراض تقديم الخدمة." },
      { type: "text", title: "حماية البيانات", body: "تتم حماية بياناتك الشخصية من خلال تدابير تقنية وإدارية، ولا يتم مشاركتها مع أطراف ثالثة إلا في نطاق الالتزامات القانونية." },
      { type: "text", body: "هذا النص مخصص للمعلومات المؤقتة. سيتم نشر سياسة الخصوصية النهائية على هذه الصفحة بعد اكتمال المراجعة القانونية.", highlighted: true },
    ],
  },
  es: {
    eyebrow: "Legal",
    title: "Política de privacidad",
    description: "La política de privacidad de MediBook explica cómo se recopilan, procesan y protegen sus datos personales.",
    sections: [
      { type: "text", title: "Datos recopilados", body: "Las solicitudes de cita, los datos de contacto y los datos de uso del sitio se recopilan para fines de prestación del servicio." },
      { type: "text", title: "Protección de datos", body: "Sus datos personales se protegen mediante medidas técnicas y administrativas y solo se comparten con terceros dentro del marco de las obligaciones legales." },
      { type: "text", body: "Este texto tiene carácter informativo provisional. La política de privacidad definitiva se publicará en esta página cuando finalice la revisión legal.", highlighted: true },
    ],
  },
} satisfies Record<string, LocalizedPageContent>;

export default function LegalPrivacyPolicy() {
  const { lang } = useLanguage();
  return <LocalizedContentPage content={contentByLanguage[lang]} />;
}
