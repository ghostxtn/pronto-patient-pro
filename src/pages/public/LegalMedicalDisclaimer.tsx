import LocalizedContentPage, { type LocalizedPageContent } from "@/components/landing/LocalizedContentPage";
import { useLanguage } from "@/contexts/LanguageContext";

const contentByLanguage = {
  en: {
    eyebrow: "Legal",
    title: "Medical Information",
    description: "Important notice about the content provided on this website.",
    sections: [
      { type: "text", title: "General Information", body: "The content on this website is for general information only and does not replace medical advice, diagnosis, or treatment. Please consult a healthcare professional for your health concerns." },
      { type: "text", title: "Emergencies", body: "Do not use this website in medical emergencies. For urgent help, call 112 or go to the nearest emergency department." },
      { type: "text", body: "This text is for interim information purposes. The final medical information notice will be published on this page after legal review is completed.", highlighted: true },
    ],
  },
  tr: {
    eyebrow: "Yasal",
    title: "Tıbbi Bilgilendirme",
    description: "Bu web sitesinde yer alan içerikler hakkında önemli bilgilendirme.",
    sections: [
      { type: "text", title: "Genel Bilgilendirme", body: "Bu web sitesindeki içerikler genel bilgilendirme amaçlıdır ve tıbbi tavsiye, teşhis veya tedavi yerine geçmez. Sağlık sorunlarınız için mutlaka bir sağlık profesyoneline başvurun." },
      { type: "text", title: "Acil Durumlar", body: "Acil sağlık durumlarında bu web sitesini kullanmayın. Acil yardım için 112'yi arayın veya en yakın acil servise başvurun." },
      { type: "text", body: "Bu metin ara dönem bilgilendirme amaçlıdır. Nihai tıbbi bilgilendirme metni hukuki inceleme tamamlandığında bu sayfada yayınlanacaktır.", highlighted: true },
    ],
  },
  fr: {
    eyebrow: "Mentions légales",
    title: "Informations médicales",
    description: "Information importante concernant le contenu présenté sur ce site web.",
    sections: [
      { type: "text", title: "Information générale", body: "Le contenu de ce site web est fourni à titre d'information générale et ne remplace pas un avis médical, un diagnostic ou un traitement. Pour toute question de santé, veuillez consulter un professionnel de santé." },
      { type: "text", title: "Urgences", body: "N'utilisez pas ce site en cas d'urgence médicale. Pour une aide urgente, appelez le 112 ou rendez-vous au service d'urgence le plus proche." },
      { type: "text", body: "Ce texte est fourni à titre transitoire. Le texte définitif d'information médicale sera publié sur cette page une fois l'examen juridique terminé.", highlighted: true },
    ],
  },
  ru: {
    eyebrow: "Правовая информация",
    title: "Медицинская информация",
    description: "Важное уведомление о содержании, размещенном на этом сайте.",
    sections: [
      { type: "text", title: "Общая информация", body: "Содержание этого сайта предназначено только для общей информации и не заменяет медицинскую консультацию, диагностику или лечение. По вопросам здоровья обязательно обращайтесь к медицинскому специалисту." },
      { type: "text", title: "Экстренные случаи", body: "Не используйте этот сайт в экстренных медицинских ситуациях. Для срочной помощи звоните по номеру 112 или обращайтесь в ближайшее отделение неотложной помощи." },
      { type: "text", body: "Этот текст носит временный информационный характер. Окончательное уведомление о медицинской информации будет опубликовано на этой странице после завершения юридической проверки.", highlighted: true },
    ],
  },
  ar: {
    eyebrow: "قانوني",
    title: "معلومات طبية",
    description: "إشعار مهم بشأن المحتوى المعروض على هذا الموقع.",
    sections: [
      { type: "text", title: "معلومات عامة", body: "المحتوى الموجود على هذا الموقع مخصص للمعلومات العامة فقط ولا يُعد بديلًا عن المشورة الطبية أو التشخيص أو العلاج. يرجى استشارة مختص رعاية صحية بشأن مشكلاتك الصحية." },
      { type: "text", title: "الحالات الطارئة", body: "لا تستخدم هذا الموقع في حالات الطوارئ الطبية. للحصول على مساعدة عاجلة، اتصل بالرقم 112 أو توجه إلى أقرب قسم طوارئ." },
      { type: "text", body: "هذا النص مخصص للمعلومات المؤقتة. سيتم نشر إشعار المعلومات الطبية النهائي على هذه الصفحة بعد اكتمال المراجعة القانونية.", highlighted: true },
    ],
  },
  es: {
    eyebrow: "Legal",
    title: "Información médica",
    description: "Aviso importante sobre el contenido disponible en este sitio web.",
    sections: [
      { type: "text", title: "Información general", body: "El contenido de este sitio web es solo para información general y no sustituye el consejo médico, el diagnóstico ni el tratamiento. Consulte siempre a un profesional sanitario para sus problemas de salud." },
      { type: "text", title: "Urgencias", body: "No utilice este sitio web en situaciones de urgencia médica. Para ayuda urgente, llame al 112 o acuda al servicio de urgencias más cercano." },
      { type: "text", body: "Este texto tiene carácter informativo provisional. El aviso médico definitivo se publicará en esta página cuando finalice la revisión legal.", highlighted: true },
    ],
  },
} satisfies Record<string, LocalizedPageContent>;

export default function LegalMedicalDisclaimer() {
  const { lang } = useLanguage();
  return <LocalizedContentPage content={contentByLanguage[lang]} />;
}
