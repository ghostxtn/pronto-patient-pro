import LocalizedContentPage, { type LocalizedPageContent } from "@/components/landing/LocalizedContentPage";
import { useLanguage } from "@/contexts/LanguageContext";

const contentByLanguage = {
  en: {
    eyebrow: "FAQ",
    title: "Topics people ask about most",
    description: "We grouped the most common questions from appointment flow to privacy topics.",
    sections: [
      {
        type: "faq",
        title: "Appointment Process",
        items: [
          {
            q: "How is an appointment request created?",
            a: "You only need to share your basic details and need through the main request flow. The clinic team reviews the request for appropriate guidance.",
          },
          {
            q: "How quickly will I receive a response?",
            a: "Response time may vary depending on clinic workload. The goal is not an automatic speed promise, but clear communication with the right specialty match.",
          },
          {
            q: "How do cancellation or postponement requests work?",
            a: "Cancellation or postponement requests are handled through clinic coordination. You will be contacted again for a suitable new schedule.",
          },
        ],
      },
      {
        type: "faq",
        title: "Doctors and Specialties",
        items: [
          {
            q: "Can I choose a doctor?",
            a: "When possible, you may state your physician preference. The clinic team provides the most appropriate guidance based on your need and current scheduling.",
          },
          {
            q: "Which specialties do you offer?",
            a: "You can review our current specialties on the Specialties page.",
          },
        ],
      },
      {
        type: "faq",
        title: "Contact and Visits",
        items: [
          {
            q: "What are the clinic working hours?",
            a: "Weekdays 09:00 - 18:00, Saturday 09:00 - 14:00. We are closed on Sundays.",
          },
          {
            q: "How can I reach the clinic?",
            a: "Please visit our Location and Access page for address and transport details.",
          },
        ],
      },
      {
        type: "faq",
        title: "Privacy and Data",
        items: [
          {
            q: "How are my personal data protected?",
            a: "Your personal data are processed within the scope of KVKK. For details, please review our KVKK Privacy Notice page.",
          },
          {
            q: "How can I submit a data subject request?",
            a: "You can follow the guidance on our Data Subject Request page to exercise your rights.",
          },
        ],
      },
    ],
  },
  tr: {
    eyebrow: "Sık Sorulan Sorular",
    title: "Merak edilen konular",
    description: "Randevu sürecinden gizlilik konularına kadar en sık sorulan soruları gruplandırdık.",
    sections: [
      {
        type: "faq",
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
        type: "faq",
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
        type: "faq",
        title: "İletişim ve Ziyaret",
        items: [
          {
            q: "Klinik çalışma saatleri nedir?",
            a: "Hafta içi 09:00 - 18:00, Cumartesi 09:00 - 14:00. Pazar günleri kapalıyız.",
          },
          {
            q: "Kliniğe nasıl ulaşabilirim?",
            a: "Adres ve ulaşım bilgileri için Adres ve Ulaşım sayfamızı ziyaret edebilirsiniz.",
          },
        ],
      },
      {
        type: "faq",
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
    ],
  },
  fr: {
    eyebrow: "FAQ",
    title: "Les sujets les plus demandés",
    description: "Nous avons regroupé les questions les plus fréquentes, du parcours de rendez-vous aux sujets de confidentialité.",
    sections: [
      {
        type: "faq",
        title: "Processus de rendez-vous",
        items: [
          {
            q: "Comment créer une demande de rendez-vous ?",
            a: "Il vous suffit de partager vos informations de base et votre besoin via le flux principal de demande. L'équipe clinique examine la demande pour assurer la bonne orientation.",
          },
          {
            q: "Sous quel délai vais-je recevoir une réponse ?",
            a: "Le délai de réponse peut varier selon la charge de la clinique. L'objectif n'est pas une promesse automatique de rapidité, mais une information claire avec une bonne orientation.",
          },
          {
            q: "Comment fonctionnent les annulations ou reports ?",
            a: "Les demandes d'annulation ou de report sont traitées par la coordination de la clinique. Vous serez recontacté pour proposer un nouveau créneau adapté.",
          },
        ],
      },
      {
        type: "faq",
        title: "Médecins et spécialités",
        items: [
          {
            q: "Puis-je choisir un médecin ?",
            a: "Lorsque cela est possible, vous pouvez indiquer votre préférence. L'équipe clinique vous oriente au mieux selon votre besoin et le planning disponible.",
          },
          {
            q: "Quelles spécialités proposez-vous ?",
            a: "Vous pouvez consulter nos spécialités actuelles sur la page Spécialités.",
          },
        ],
      },
      {
        type: "faq",
        title: "Contact et visite",
        items: [
          {
            q: "Quels sont les horaires de la clinique ?",
            a: "En semaine 09:00 - 18:00, samedi 09:00 - 14:00. Nous sommes fermés le dimanche.",
          },
          {
            q: "Comment puis-je me rendre à la clinique ?",
            a: "Veuillez consulter notre page Adresse et accès pour l'adresse et les détails de transport.",
          },
        ],
      },
      {
        type: "faq",
        title: "Confidentialité et données",
        items: [
          {
            q: "Comment mes données personnelles sont-elles protégées ?",
            a: "Vos données personnelles sont traitées dans le cadre de la KVKK. Pour plus de détails, veuillez consulter notre Avis de confidentialité KVKK.",
          },
          {
            q: "Comment déposer une demande de personne concernée ?",
            a: "Vous pouvez suivre les informations de notre page Demande de la personne concernée pour exercer vos droits.",
          },
        ],
      },
    ],
  },
  ru: {
    eyebrow: "FAQ",
    title: "Наиболее частые вопросы",
    description: "Мы сгруппировали самые частые вопросы - от процесса записи до тем конфиденциальности.",
    sections: [
      {
        type: "faq",
        title: "Процесс записи",
        items: [
          {
            q: "Как создается запрос на прием?",
            a: "Достаточно указать базовую информацию и ваш запрос в основном потоке записи. Команда клиники рассматривает обращение для правильного направления.",
          },
          {
            q: "Как быстро я получу ответ?",
            a: "Срок ответа может меняться в зависимости от загрузки клиники. Цель - не автоматическое обещание скорости, а понятная коммуникация с правильным подбором специальности.",
          },
          {
            q: "Как работают отмена или перенос?",
            a: "Запросы на отмену или перенос обрабатываются через координацию клиники. С вами свяжутся повторно для согласования нового подходящего времени.",
          },
        ],
      },
      {
        type: "faq",
        title: "Врачи и специальности",
        items: [
          {
            q: "Могу ли я выбрать врача?",
            a: "Когда это возможно, вы можете указать предпочтительного врача. Команда клиники предложит наиболее подходящий вариант с учетом вашего запроса и текущего расписания.",
          },
          {
            q: "Какие специальности у вас есть?",
            a: "С текущими направлениями можно ознакомиться на странице Специальности.",
          },
        ],
      },
      {
        type: "faq",
        title: "Контакты и визит",
        items: [
          {
            q: "Каковы часы работы клиники?",
            a: "В будние дни 09:00 - 18:00, в субботу 09:00 - 14:00. По воскресеньям мы закрыты.",
          },
          {
            q: "Как добраться до клиники?",
            a: "Пожалуйста, посетите нашу страницу Адрес и доступ для получения адреса и транспортной информации.",
          },
        ],
      },
      {
        type: "faq",
        title: "Конфиденциальность и данные",
        items: [
          {
            q: "Как защищаются мои персональные данные?",
            a: "Ваши персональные данные обрабатываются в рамках KVKK. Для подробностей ознакомьтесь с нашей страницей уведомления о конфиденциальности KVKK.",
          },
          {
            q: "Как подать запрос субъекта данных?",
            a: "Чтобы воспользоваться своими правами, следуйте инструкции на странице запроса субъекта данных.",
          },
        ],
      },
    ],
  },
  ar: {
    eyebrow: "الأسئلة الشائعة",
    title: "أكثر المواضيع التي يُسأل عنها",
    description: "جمعنا أكثر الأسئلة شيوعًا من عملية الموعد إلى موضوعات الخصوصية.",
    sections: [
      {
        type: "faq",
        title: "عملية الموعد",
        items: [
          {
            q: "كيف يتم إنشاء طلب موعد؟",
            a: "يكفي أن تشارك معلوماتك الأساسية واحتياجك عبر مسار الطلب الرئيسي. يراجع فريق العيادة الطلب لتقديم التوجيه المناسب.",
          },
          {
            q: "كم يستغرق الرد على طلبي؟",
            a: "قد تختلف مدة الرد حسب ضغط العمل في العيادة. الهدف ليس وعدًا تلقائيًا بالسرعة، بل تواصل واضح مع توجيه صحيح إلى التخصص المناسب.",
          },
          {
            q: "كيف تعمل طلبات الإلغاء أو التأجيل؟",
            a: "تتم معالجة طلبات الإلغاء أو التأجيل عبر تنسيق العيادة. وسيتم التواصل معك مرة أخرى لتحديد موعد جديد مناسب.",
          },
        ],
      },
      {
        type: "faq",
        title: "الأطباء والتخصصات",
        items: [
          {
            q: "هل يمكنني اختيار طبيب؟",
            a: "عندما يكون ذلك ممكنًا يمكنك ذكر تفضيلك للطبيب. يقدم فريق العيادة التوجيه الأنسب وفقًا لاحتياجك والجدول الحالي.",
          },
          {
            q: "ما التخصصات المتوفرة لديكم؟",
            a: "يمكنك مراجعة تخصصاتنا الحالية من صفحة التخصصات.",
          },
        ],
      },
      {
        type: "faq",
        title: "التواصل والزيارة",
        items: [
          {
            q: "ما ساعات عمل العيادة؟",
            a: "أيام الأسبوع 09:00 - 18:00، السبت 09:00 - 14:00. نحن مغلقون يوم الأحد.",
          },
          {
            q: "كيف يمكنني الوصول إلى العيادة؟",
            a: "يرجى زيارة صفحة العنوان والوصول للحصول على العنوان وتفاصيل المواصلات.",
          },
        ],
      },
      {
        type: "faq",
        title: "الخصوصية والبيانات",
        items: [
          {
            q: "كيف يتم حماية بياناتي الشخصية؟",
            a: "تتم معالجة بياناتك الشخصية ضمن نطاق KVKK. لمزيد من التفاصيل، يرجى مراجعة صفحة إشعار الخصوصية KVKK.",
          },
          {
            q: "كيف أقدم طلب صاحب البيانات؟",
            a: "يمكنك اتباع الإرشادات الموجودة في صفحة طلب صاحب البيانات لممارسة حقوقك.",
          },
        ],
      },
    ],
  },
  es: {
    eyebrow: "FAQ",
    title: "Los temas que más se consultan",
    description: "Agrupamos las preguntas más frecuentes, desde el proceso de cita hasta los temas de privacidad.",
    sections: [
      {
        type: "faq",
        title: "Proceso de cita",
        items: [
          {
            q: "¿Cómo se crea una solicitud de cita?",
            a: "Solo necesita compartir sus datos básicos y su necesidad mediante el flujo principal de solicitud. El equipo de la clínica revisa la solicitud para ofrecer la orientación adecuada.",
          },
          {
            q: "¿Cuánto tardaré en recibir una respuesta?",
            a: "El tiempo de respuesta puede variar según la carga de la clínica. El objetivo no es prometer velocidad automática, sino ofrecer una comunicación clara con la especialidad correcta.",
          },
          {
            q: "¿Cómo funcionan las cancelaciones o reprogramaciones?",
            a: "Las solicitudes de cancelación o reprogramación se gestionan a través de la coordinación de la clínica. Se pondrán en contacto con usted nuevamente para acordar un nuevo horario adecuado.",
          },
        ],
      },
      {
        type: "faq",
        title: "Médicos y especialidades",
        items: [
          {
            q: "¿Puedo elegir un médico?",
            a: "Cuando sea posible, puede indicar su preferencia. El equipo de la clínica ofrecerá la orientación más adecuada según su necesidad y la planificación actual.",
          },
          {
            q: "¿Qué especialidades ofrecen?",
            a: "Puede consultar nuestras especialidades actuales en la página de Especialidades.",
          },
        ],
      },
      {
        type: "faq",
        title: "Contacto y visita",
        items: [
          {
            q: "¿Cuál es el horario de la clínica?",
            a: "Días laborables 09:00 - 18:00, sábado 09:00 - 14:00. Cerramos los domingos.",
          },
          {
            q: "¿Cómo puedo llegar a la clínica?",
            a: "Visite nuestra página de Dirección y acceso para ver la dirección y la información de transporte.",
          },
        ],
      },
      {
        type: "faq",
        title: "Privacidad y datos",
        items: [
          {
            q: "¿Cómo se protegen mis datos personales?",
            a: "Sus datos personales se procesan dentro del alcance de KVKK. Para más detalles, revise nuestra página de Aviso de privacidad KVKK.",
          },
          {
            q: "¿Cómo presento una solicitud del titular de los datos?",
            a: "Puede seguir la información de nuestra página de Solicitud del titular de los datos para ejercer sus derechos.",
          },
        ],
      },
    ],
  },
} satisfies Record<string, LocalizedPageContent>;

export default function Faq() {
  const { lang } = useLanguage();
  return <LocalizedContentPage content={contentByLanguage[lang]} />;
}
