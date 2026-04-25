import LocalizedContentPage, { type LocalizedPageContent } from "@/components/landing/LocalizedContentPage";
import { useLanguage } from "@/contexts/LanguageContext";

const contentByLanguage = {
  en: {
    eyebrow: "Legal",
    title: "KVKK Privacy Notice",
    description: "Information regarding our disclosure obligation under Law No. 6698 on the Protection of Personal Data.",
    sections: [
      { type: "text", title: "Data Controller", body: "As MediBook Health Services, we show the highest level of care for the security of your personal data." },
      { type: "text", title: "Purposes of Processing Personal Data", body: "Your personal data are processed for the provision of healthcare services, appointment management, fulfillment of legal obligations, and improvement of service quality." },
      { type: "text", body: "This text is for interim information purposes. The final KVKK privacy notice will be published on this page after legal review is completed. It does not replace the final legal text in its current form.", highlighted: true },
    ],
  },
  tr: {
    eyebrow: "Yasal",
    title: "KVKK Aydınlatma Metni",
    description: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma yükümlülüğümüze ilişkin bilgilendirme.",
    sections: [
      { type: "text", title: "Veri Sorumlusu", body: "MediBook Sağlık Hizmetleri olarak kişisel verilerinizin güvenliği konusunda azami hassasiyet göstermekteyiz." },
      { type: "text", title: "Kişisel Verilerin İşlenme Amaçları", body: "Kişisel verileriniz; sağlık hizmetlerinin sunulması, randevu yönetimi, yasal yükümlülüklerin yerine getirilmesi ve hizmet kalitesinin artırılması amaçlarıyla işlenmektedir." },
      { type: "text", body: "Bu metin ara dönem bilgilendirme amaçlıdır. Nihai KVKK aydınlatma metni, hukuki inceleme tamamlandığında bu sayfada yayınlanacaktır. Güncel haliyle kesin hukuki metin yerine geçmez.", highlighted: true },
    ],
  },
  fr: {
    eyebrow: "Mentions légales",
    title: "Avis de confidentialité KVKK",
    description: "Information relative à notre obligation d'information au titre de la loi n° 6698 sur la protection des données personnelles.",
    sections: [
      { type: "text", title: "Responsable du traitement", body: "En tant que MediBook Services de Santé, nous accordons la plus grande attention à la sécurité de vos données personnelles." },
      { type: "text", title: "Finalités du traitement des données personnelles", body: "Vos données personnelles sont traitées pour la fourniture des services de santé, la gestion des rendez-vous, le respect des obligations légales et l'amélioration de la qualité des services." },
      { type: "text", body: "Ce texte est fourni à titre transitoire. L'avis de confidentialité KVKK définitif sera publié sur cette page une fois l'examen juridique terminé. Dans sa version actuelle, il ne remplace pas le texte juridique final.", highlighted: true },
    ],
  },
  ru: {
    eyebrow: "Правовая информация",
    title: "Уведомление о конфиденциальности KVKK",
    description: "Информация о нашей обязанности по раскрытию информации в рамках Закона № 6698 о защите персональных данных.",
    sections: [
      { type: "text", title: "Оператор данных", body: "Как MediBook Health Services, мы проявляем максимальную заботу о безопасности ваших персональных данных." },
      { type: "text", title: "Цели обработки персональных данных", body: "Ваши персональные данные обрабатываются для оказания медицинских услуг, управления записями, выполнения юридических обязательств и повышения качества услуг." },
      { type: "text", body: "Этот текст носит временный информационный характер. Окончательное уведомление KVKK будет опубликовано на этой странице после завершения юридической проверки. В текущем виде оно не заменяет окончательный юридический текст.", highlighted: true },
    ],
  },
  ar: {
    eyebrow: "قانوني",
    title: "إشعار الخصوصية KVKK",
    description: "معلومات تتعلق بالتزامنا بالإفصاح بموجب القانون رقم 6698 لحماية البيانات الشخصية.",
    sections: [
      { type: "text", title: "مسؤول البيانات", body: "بصفتنا MediBook للخدمات الصحية، فإننا نولي أعلى درجات العناية لأمن بياناتك الشخصية." },
      { type: "text", title: "أغراض معالجة البيانات الشخصية", body: "تتم معالجة بياناتك الشخصية لأغراض تقديم الخدمات الصحية وإدارة المواعيد والوفاء بالالتزامات القانونية وتحسين جودة الخدمة." },
      { type: "text", body: "هذا النص مخصص للمعلومات المؤقتة. سيتم نشر إشعار الخصوصية النهائي الخاص بـ KVKK على هذه الصفحة بعد اكتمال المراجعة القانونية. ولا يحل بصيغته الحالية محل النص القانوني النهائي.", highlighted: true },
    ],
  },
  es: {
    eyebrow: "Legal",
    title: "Aviso de privacidad (KVKK)",
    description: "Información relativa a nuestra obligación de información en virtud de la Ley n.º 6698 sobre Protección de Datos Personales.",
    sections: [
      { type: "text", title: "Responsable del tratamiento", body: "Como MediBook Servicios de Salud, mostramos el máximo cuidado en relación con la seguridad de sus datos personales." },
      { type: "text", title: "Finalidades del tratamiento de los datos personales", body: "Sus datos personales se procesan para la prestación de servicios sanitarios, la gestión de citas, el cumplimiento de obligaciones legales y la mejora de la calidad del servicio." },
      { type: "text", body: "Este texto tiene carácter informativo provisional. El aviso de privacidad KVKK definitivo se publicará en esta página cuando finalice la revisión legal. En su estado actual, no sustituye al texto legal definitivo.", highlighted: true },
    ],
  },
} satisfies Record<string, LocalizedPageContent>;

export default function LegalKvkk() {
  const { lang } = useLanguage();
  return <LocalizedContentPage content={contentByLanguage[lang]} />;
}
