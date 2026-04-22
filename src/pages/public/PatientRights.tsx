import LocalizedContentPage, { type LocalizedPageContent } from "@/components/landing/LocalizedContentPage";
import { useLanguage } from "@/contexts/LanguageContext";

const contentByLanguage = {
  en: {
    eyebrow: "Patient Rights",
    title: "Patient rights and expectations",
    description: "Basic information about your rights during treatment and the mutual expectations within our clinic.",
    sections: [
      { type: "list", title: "Core Patient Rights", items: ["The right to benefit from healthcare services equally.", "The right to receive information and request explanations about treatment processes.", "The right to privacy and personal data protection.", "The right to accept or refuse treatment.", "The right to submit complaints and suggestions."] },
      { type: "text", body: "This page is for general information only and does not constitute legal advice. For detailed information, you may consult the Ministry of Health Patient Rights Regulation.", highlighted: true },
    ],
  },
  tr: {
    eyebrow: "Hasta Hakları",
    title: "Hasta hakları ve beklentiler",
    description: "Kliniğimizde tedavi sürecindeki haklarınız ve karşılıklı beklentiler hakkında temel bilgiler.",
    sections: [
      { type: "list", title: "Temel Hasta Hakları", items: ["Sağlık hizmetlerinden eşit şekilde yararlanma hakkı.", "Bilgilendirilme ve tedavi süreçleri hakkında açıklama isteme hakkı.", "Kişisel verilerin korunması ve gizlilik hakkı.", "Tedaviyi kabul etme veya reddetme hakkı.", "Şikâyet ve öneri bildirme hakkı."] },
      { type: "text", body: "Bu sayfa genel bilgilendirme amaçlıdır ve hukuki tavsiye niteliği taşımaz. Detaylı bilgi için Sağlık Bakanlığı Hasta Hakları Yönetmeliği'ne başvurabilirsiniz.", highlighted: true },
    ],
  },
  fr: {
    eyebrow: "Droits du patient",
    title: "Droits du patient et attentes",
    description: "Informations de base sur vos droits pendant le traitement et sur les attentes mutuelles au sein de notre clinique.",
    sections: [
      { type: "list", title: "Droits fondamentaux du patient", items: ["Le droit de bénéficier des services de santé sur un pied d'égalité.", "Le droit d'être informé et de demander des explications sur le parcours de soins.", "Le droit à la confidentialité et à la protection des données personnelles.", "Le droit d'accepter ou de refuser un traitement.", "Le droit de formuler des plaintes et des suggestions."] },
      { type: "text", body: "Cette page est fournie à titre d'information générale et ne constitue pas un avis juridique. Pour des informations détaillées, vous pouvez consulter le règlement sur les droits des patients du ministère de la Santé.", highlighted: true },
    ],
  },
  ru: {
    eyebrow: "Права пациента",
    title: "Права пациента и ожидания",
    description: "Основная информация о ваших правах во время лечения и взаимных ожиданиях в нашей клинике.",
    sections: [
      { type: "list", title: "Основные права пациента", items: ["Право на равный доступ к медицинским услугам.", "Право получать информацию и просить разъяснения по вопросам лечения.", "Право на конфиденциальность и защиту персональных данных.", "Право согласиться на лечение или отказаться от него.", "Право направлять жалобы и предложения."] },
      { type: "text", body: "Эта страница предназначена только для общей информации и не является юридической консультацией. Для подробной информации можно обратиться к Регламенту прав пациентов Министерства здравоохранения.", highlighted: true },
    ],
  },
  ar: {
    eyebrow: "حقوق المريض",
    title: "حقوق المريض والتوقعات",
    description: "معلومات أساسية حول حقوقك أثناء العلاج والتوقعات المتبادلة داخل عيادتنا.",
    sections: [
      { type: "list", title: "حقوق المريض الأساسية", items: ["الحق في الاستفادة من خدمات الرعاية الصحية بشكل متساوٍ.", "الحق في الحصول على المعلومات وطلب شرح لمسارات العلاج.", "الحق في الخصوصية وحماية البيانات الشخصية.", "الحق في قبول العلاج أو رفضه.", "الحق في تقديم الشكاوى والمقترحات."] },
      { type: "text", body: "هذه الصفحة مخصصة للمعلومات العامة فقط ولا تشكل استشارة قانونية. للحصول على معلومات تفصيلية، يمكنكم الرجوع إلى لائحة حقوق المرضى الصادرة عن وزارة الصحة.", highlighted: true },
    ],
  },
  es: {
    eyebrow: "Derechos del paciente",
    title: "Derechos del paciente y expectativas",
    description: "Información básica sobre sus derechos durante el tratamiento y las expectativas mutuas dentro de nuestra clínica.",
    sections: [
      { type: "list", title: "Derechos básicos del paciente", items: ["Derecho a beneficiarse de los servicios sanitarios en igualdad de condiciones.", "Derecho a recibir información y solicitar explicaciones sobre los procesos de tratamiento.", "Derecho a la privacidad y a la protección de los datos personales.", "Derecho a aceptar o rechazar el tratamiento.", "Derecho a presentar quejas y sugerencias."] },
      { type: "text", body: "Esta página tiene fines informativos generales y no constituye asesoramiento jurídico. Para información detallada, puede consultar el Reglamento de Derechos del Paciente del Ministerio de Salud.", highlighted: true },
    ],
  },
} satisfies Record<string, LocalizedPageContent>;

export default function PatientRights() {
  const { lang } = useLanguage();
  return <LocalizedContentPage content={contentByLanguage[lang]} />;
}
