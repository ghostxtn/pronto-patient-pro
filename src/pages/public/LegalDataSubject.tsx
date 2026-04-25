import LocalizedContentPage, { type LocalizedPageContent } from "@/components/landing/LocalizedContentPage";
import { useLanguage } from "@/contexts/LanguageContext";

const contentByLanguage = {
  en: {
    eyebrow: "Legal",
    title: "Data Subject Request Form",
    description: "Application information for exercising your rights as a data subject under Law No. 6698.",
    sections: [
      { type: "text", title: "Your Right to Apply", body: "Under Article 11 of the KVKK, you have the right to learn whether your personal data are processed, request correction or deletion, and object to processing where applicable." },
      { type: "text", title: "Application Method", body: "You may submit your applications in writing or via the email address listed on our contact page. Your application will be answered within 30 days at the latest." },
      { type: "text", body: "This text is for interim information purposes. The final data subject request process and form will be published on this page after legal review is completed.", highlighted: true },
    ],
  },
  tr: {
    eyebrow: "Yasal",
    title: "Veri Sahibi Başvuru Formu",
    description: "6698 sayılı KVKK kapsamında veri sahibi olarak haklarınızı kullanmak için başvuru bilgileri.",
    sections: [
      { type: "text", title: "Başvuru Hakkınız", body: "KVKK'nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini talep etme ve itiraz haklarınız bulunmaktadır." },
      { type: "text", title: "Başvuru Yöntemi", body: "Başvurularınızı yazılı olarak veya iletişim sayfamızda belirtilen e-posta adresi üzerinden iletebilirsiniz. Başvurunuz en geç 30 gün içinde yanıtlanacaktır." },
      { type: "text", body: "Bu metin ara dönem bilgilendirme amaçlıdır. Nihai veri sahibi başvuru süreci ve formu hukuki inceleme tamamlandığında bu sayfada yayınlanacaktır.", highlighted: true },
    ],
  },
  fr: {
    eyebrow: "Mentions légales",
    title: "Demande de la personne concernée",
    description: "Informations de demande pour exercer vos droits en tant que personne concernée au titre de la loi n° 6698.",
    sections: [
      { type: "text", title: "Votre droit de demande", body: "Conformément à l'article 11 de la KVKK, vous avez le droit de savoir si vos données personnelles sont traitées, de demander leur rectification ou leur suppression et de vous opposer au traitement lorsque cela est applicable." },
      { type: "text", title: "Méthode de demande", body: "Vous pouvez soumettre votre demande par écrit ou via l'adresse e-mail indiquée sur notre page de contact. Votre demande recevra une réponse dans un délai maximum de 30 jours." },
      { type: "text", body: "Ce texte est fourni à titre transitoire. Le processus et le formulaire définitifs de demande de la personne concernée seront publiés sur cette page une fois l'examen juridique terminé.", highlighted: true },
    ],
  },
  ru: {
    eyebrow: "Правовая информация",
    title: "Запрос субъекта данных",
    description: "Информация о подаче запроса для реализации ваших прав как субъекта данных в рамках Закона № 6698.",
    sections: [
      { type: "text", title: "Ваше право на обращение", body: "Согласно статье 11 KVKK, вы имеете право узнать, обрабатываются ли ваши персональные данные, потребовать их исправления или удаления, а также возразить против обработки в предусмотренных случаях." },
      { type: "text", title: "Способ подачи запроса", body: "Вы можете подать заявление в письменной форме или через адрес электронной почты, указанный на нашей странице контактов. Ответ будет предоставлен не позднее чем через 30 дней." },
      { type: "text", body: "Этот текст носит временный информационный характер. Окончательный процесс и форма запроса субъекта данных будут опубликованы на этой странице после завершения юридической проверки.", highlighted: true },
    ],
  },
  ar: {
    eyebrow: "قانوني",
    title: "طلب صاحب البيانات",
    description: "معلومات التقديم لممارسة حقوقك بصفتك صاحب بيانات بموجب القانون رقم 6698.",
    sections: [
      { type: "text", title: "حقك في التقديم", body: "بموجب المادة 11 من KVKK، يحق لك معرفة ما إذا كانت بياناتك الشخصية تتم معالجتها، وطلب تصحيحها أو حذفها، والاعتراض على المعالجة حيثما ينطبق ذلك." },
      { type: "text", title: "طريقة التقديم", body: "يمكنك إرسال طلباتك كتابيًا أو عبر عنوان البريد الإلكتروني المذكور في صفحة الاتصال الخاصة بنا. وسيتم الرد على طلبك خلال مدة لا تتجاوز 30 يومًا." },
      { type: "text", body: "هذا النص مخصص للمعلومات المؤقتة. سيتم نشر الإجراء والنموذج النهائيين لطلب صاحب البيانات على هذه الصفحة بعد اكتمال المراجعة القانونية.", highlighted: true },
    ],
  },
  es: {
    eyebrow: "Legal",
    title: "Solicitud del titular de los datos",
    description: "Información de solicitud para ejercer sus derechos como titular de los datos en virtud de la Ley n.º 6698.",
    sections: [
      { type: "text", title: "Su derecho a solicitar", body: "Con arreglo al artículo 11 de KVKK, tiene derecho a saber si se procesan sus datos personales, a solicitar su corrección o eliminación y a oponerse al tratamiento cuando corresponda." },
      { type: "text", title: "Método de solicitud", body: "Puede presentar sus solicitudes por escrito o mediante la dirección de correo electrónico indicada en nuestra página de contacto. Su solicitud será respondida en un plazo máximo de 30 días." },
      { type: "text", body: "Este texto tiene carácter informativo provisional. El proceso y el formulario definitivos para la solicitud del titular de los datos se publicarán en esta página cuando finalice la revisión legal.", highlighted: true },
    ],
  },
} satisfies Record<string, LocalizedPageContent>;

export default function LegalDataSubject() {
  const { lang } = useLanguage();
  return <LocalizedContentPage content={contentByLanguage[lang]} />;
}
