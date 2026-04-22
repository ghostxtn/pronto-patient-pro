import LocalizedContentPage, { type LocalizedPageContent } from "@/components/landing/LocalizedContentPage";
import { useLanguage } from "@/contexts/LanguageContext";

const contentByLanguage = {
  en: {
    eyebrow: "Our Approach",
    title: "Why does this clinic process work this way?",
    description:
      "MediBook favors accurate specialty matching and consistent patient communication over instant appointment promises.",
    sections: [
      {
        type: "text",
        title: "What We Do Differently",
        body: "Your appointment request does not pass through an automatic approval flow. The clinic team reviews your need, identifies the right specialty, and clarifies the process with you. This approach prioritizes accurate guidance over speed.",
      },
      {
        type: "text",
        title: "Why This Approach",
        body: "In a clinic setting, the most critical step is matching the patient with the right specialty. Automatic approval systems can feel faster, but they also increase the risk of misdirection. A coordination-supported process creates a better starting point for the patient.",
      },
      {
        type: "list",
        title: "What Changes for the Patient",
        items: [
          "Your request goes through a real clinical review.",
          "You are informed at each step of the process.",
          "Your doctor preference is considered whenever possible, but it cannot be guaranteed.",
        ],
      },
    ],
    actions: [
      { label: "Create Appointment Request", href: "/request-appointment", variant: "default", withArrow: true },
      { label: "See the Appointment Process", href: "/appointment-process", variant: "outline" },
    ],
  },
  tr: {
    eyebrow: "Yaklaşımımız",
    title: "Neden bu klinikte süreç böyle işliyor?",
    description:
      "MediBook, hızlı randevu vaatleri yerine doğru uzmanlık eşleşmesini ve düzenli hasta iletişimini önceleyen bir klinik yaklaşımını benimser.",
    sections: [
      {
        type: "text",
        title: "Neyi farklı yapıyoruz?",
        body: "Randevu talebiniz otomatik bir onay mekanizmasından geçmez. Klinik ekibi ihtiyacınızı değerlendirir, uygun uzmanlığı belirler ve süreci sizinle birlikte netleştirir. Bu yaklaşım, hız yerine doğru yönlendirmeyi önceler.",
      },
      {
        type: "text",
        title: "Neden bu yaklaşım?",
        body: "Bir klinikte en kritik adım doğru uzmanlıkla eşleşmektir. Otomatik onay sistemleri hız kazandırsa da yanlış yönlendirme riskini artırır. Koordinasyon destekli bir süreç, hastanın ihtiyacına daha uygun bir başlangıç sağlar.",
      },
      {
        type: "list",
        title: "Hasta açısından ne değişir?",
        items: [
          "Talebiniz gerçek bir klinik değerlendirmeden geçer.",
          "Sürecin her adımında bilgilendirilirsiniz.",
          "Doktor tercihiniz mümkün olduğunca dikkate alınır, ancak garanti verilmez.",
        ],
      },
    ],
    actions: [
      { label: "Randevu Talebi Oluştur", href: "/request-appointment", variant: "default", withArrow: true },
      { label: "Randevu Sürecini Gör", href: "/appointment-process", variant: "outline" },
    ],
  },
  fr: {
    eyebrow: "Notre approche",
    title: "Pourquoi le parcours dans cette clinique fonctionne-t-il ainsi ?",
    description:
      "MediBook privilégie une bonne orientation vers la bonne spécialité et une communication régulière avec le patient plutôt que des promesses de rendez-vous immédiats.",
    sections: [
      {
        type: "text",
        title: "Ce que nous faisons différemment",
        body: "Votre demande de rendez-vous ne passe pas par une validation automatique. L'équipe clinique évalue votre besoin, identifie la spécialité appropriée et clarifie le processus avec vous. Cette approche privilégie une orientation juste plutôt que la vitesse.",
      },
      {
        type: "text",
        title: "Pourquoi cette approche",
        body: "Dans une clinique, l'étape la plus critique est de faire correspondre le patient à la bonne spécialité. Les systèmes de validation automatique peuvent sembler plus rapides, mais ils augmentent aussi le risque d'une mauvaise orientation. Un parcours soutenu par la coordination offre un meilleur point de départ.",
      },
      {
        type: "list",
        title: "Ce que cela change pour le patient",
        items: [
          "Votre demande fait l'objet d'une véritable évaluation clinique.",
          "Vous êtes informé à chaque étape du processus.",
          "Votre préférence de médecin est prise en compte dans la mesure du possible, sans garantie absolue.",
        ],
      },
    ],
    actions: [
      { label: "Créer une demande de rendez-vous", href: "/request-appointment", variant: "default", withArrow: true },
      { label: "Voir le processus de rendez-vous", href: "/appointment-process", variant: "outline" },
    ],
  },
  ru: {
    eyebrow: "Наш подход",
    title: "Почему процесс в этой клинике устроен именно так?",
    description:
      "MediBook делает акцент не на мгновенных обещаниях записи, а на правильном подборе специальности и регулярной коммуникации с пациентом.",
    sections: [
      {
        type: "text",
        title: "Что мы делаем иначе",
        body: "Ваш запрос на прием не проходит через автоматическое подтверждение. Команда клиники оценивает вашу потребность, определяет подходящую специальность и уточняет процесс вместе с вами. Такой подход ставит точное направление выше скорости.",
      },
      {
        type: "text",
        title: "Почему именно так",
        body: "В клинике самый важный шаг - сопоставить пациента с нужной специальностью. Автоматические системы подтверждения могут казаться быстрее, но повышают риск неверного направления. Процесс с координационной поддержкой дает пациенту более подходящую стартовую точку.",
      },
      {
        type: "list",
        title: "Что это меняет для пациента",
        items: [
          "Ваш запрос проходит реальную клиническую оценку.",
          "Вы получаете информацию на каждом этапе процесса.",
          "Предпочтение по врачу учитывается по возможности, но не гарантируется.",
        ],
      },
    ],
    actions: [
      { label: "Создать запрос на запись", href: "/request-appointment", variant: "default", withArrow: true },
      { label: "Посмотреть процесс записи", href: "/appointment-process", variant: "outline" },
    ],
  },
  ar: {
    eyebrow: "نهجنا",
    title: "لماذا تسير العملية في هذه العيادة بهذه الطريقة؟",
    description:
      "تعطي MediBook الأولوية لمطابقة التخصص بشكل صحيح والتواصل المنتظم مع المريض بدلًا من وعود المواعيد الفورية.",
    sections: [
      {
        type: "text",
        title: "ما الذي نفعله بشكل مختلف",
        body: "طلب موعدك لا يمر عبر موافقة تلقائية. يقوم فريق العيادة بتقييم احتياجك وتحديد التخصص المناسب وتوضيح العملية معك. هذا النهج يفضل التوجيه الصحيح على السرعة.",
      },
      {
        type: "text",
        title: "لماذا هذا النهج",
        body: "في العيادة، أهم خطوة هي مطابقة المريض مع التخصص المناسب. قد تبدو أنظمة الموافقة التلقائية أسرع، لكنها تزيد أيضًا من خطر التوجيه الخاطئ. العملية المدعومة بالتنسيق تمنح المريض بداية أنسب.",
      },
      {
        type: "list",
        title: "ما الذي يتغير بالنسبة للمريض",
        items: [
          "يمر طلبك بمراجعة سريرية فعلية.",
          "يتم إبلاغك في كل مرحلة من مراحل العملية.",
          "يؤخذ تفضيلك للطبيب في الاعتبار قدر الإمكان، لكن من دون ضمان كامل.",
        ],
      },
    ],
    actions: [
      { label: "إنشاء طلب موعد", href: "/request-appointment", variant: "default", withArrow: true },
      { label: "عرض عملية الموعد", href: "/appointment-process", variant: "outline" },
    ],
  },
  es: {
    eyebrow: "Nuestro enfoque",
    title: "¿Por qué funciona así el proceso en esta clínica?",
    description:
      "MediBook prioriza la correcta asignación de especialidad y la comunicación constante con el paciente por encima de promesas de citas inmediatas.",
    sections: [
      {
        type: "text",
        title: "Qué hacemos diferente",
        body: "Su solicitud de cita no pasa por una aprobación automática. El equipo de la clínica evalúa su necesidad, identifica la especialidad adecuada y aclara el proceso con usted. Este enfoque prioriza una orientación correcta en lugar de la velocidad.",
      },
      {
        type: "text",
        title: "Por qué este enfoque",
        body: "En una clínica, el paso más crítico es conectar al paciente con la especialidad correcta. Los sistemas de aprobación automática pueden parecer más rápidos, pero también aumentan el riesgo de una derivación incorrecta. Un proceso apoyado por coordinación ofrece un mejor punto de partida.",
      },
      {
        type: "list",
        title: "Qué cambia para el paciente",
        items: [
          "Su solicitud pasa por una evaluación clínica real.",
          "Recibe información en cada etapa del proceso.",
          "Su preferencia de médico se tiene en cuenta siempre que sea posible, pero no puede garantizarse.",
        ],
      },
    ],
    actions: [
      { label: "Crear solicitud de cita", href: "/request-appointment", variant: "default", withArrow: true },
      { label: "Ver el proceso de cita", href: "/appointment-process", variant: "outline" },
    ],
  },
} satisfies Record<string, LocalizedPageContent>;

export default function WhyMedibook() {
  const { lang } = useLanguage();
  return <LocalizedContentPage content={contentByLanguage[lang]} />;
}
