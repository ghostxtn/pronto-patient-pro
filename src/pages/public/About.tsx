import LocalizedContentPage, { type LocalizedPageContent } from "@/components/landing/LocalizedContentPage";
import { useLanguage } from "@/contexts/LanguageContext";

const contentByLanguage = {
  en: {
    eyebrow: "About Us",
    title: "What kind of clinic are we?",
    description:
      "MediBook is a single-center healthcare organization that coordinates patient care through a structured clinic workflow.",
    sections: [
      {
        type: "text",
        title: "How We Work",
        body: "We manage the patient journey from the first request through follow-up within a single coordination structure. The clinic team reviews each request and guides the patient to the appropriate specialty. The goal is not speed alone, but the right start and clear communication.",
      },
      {
        type: "text",
        title: "Team and Structure",
        body: "Our physicians, coordination team, and patient communication unit work together. Each specialty manages its own clinical process while the central coordination team keeps the overall flow aligned.",
      },
    ],
    actions: [
      { label: "See Our Doctors", href: "/doctors", variant: "default", withArrow: true },
      { label: "See Our Approach", href: "/why-medibook", variant: "outline" },
    ],
  },
  tr: {
    eyebrow: "Hakkımızda",
    title: "Biz nasıl bir kliniğiz?",
    description:
      "MediBook, koordinasyon odaklı bir klinik yapısı içinde hasta bakımını düzenleyen tek merkezli bir sağlık kuruluşudur.",
    sections: [
      {
        type: "text",
        title: "Çalışma Yaklaşımımız",
        body: "Hasta sürecini ilk talepten takibe kadar tek bir koordinasyon yapısı içinde yönetiyoruz. Klinik ekibi, her talebi değerlendirerek uygun uzmanlığa yönlendirme yapar. Amaç hız değil, doğru başlangıç ve düzenli iletişimdir.",
      },
      {
        type: "text",
        title: "Ekip ve Yapı",
        body: "Hekim kadrosu, koordinasyon ekibi ve hasta iletişim birimi birlikte çalışır. Her uzmanlık alanı kendi klinik sürecini yönetirken, genel koordinasyon merkezi akışı birleştirir.",
      },
    ],
    actions: [
      { label: "Doktorlarımızı Gör", href: "/doctors", variant: "default", withArrow: true },
      { label: "Yaklaşımımızı Gör", href: "/why-medibook", variant: "outline" },
    ],
  },
  fr: {
    eyebrow: "À propos",
    title: "Quel type de clinique sommes-nous ?",
    description:
      "MediBook est un établissement de santé centralisé qui organise le parcours patient au sein d'une structure clinique coordonnée.",
    sections: [
      {
        type: "text",
        title: "Notre mode de fonctionnement",
        body: "Nous gérons le parcours patient, de la première demande jusqu'au suivi, au sein d'une structure de coordination unique. L'équipe clinique évalue chaque demande et oriente le patient vers la spécialité adaptée. L'objectif n'est pas seulement la rapidité, mais aussi un bon départ et une communication régulière.",
      },
      {
        type: "text",
        title: "Équipe et organisation",
        body: "Le corps médical, l'équipe de coordination et l'unité de relation patient travaillent ensemble. Chaque spécialité gère son propre processus clinique tandis que la coordination centrale maintient la cohérence de l'ensemble.",
      },
    ],
    actions: [
      { label: "Voir nos médecins", href: "/doctors", variant: "default", withArrow: true },
      { label: "Voir notre approche", href: "/why-medibook", variant: "outline" },
    ],
  },
  ru: {
    eyebrow: "О нас",
    title: "Что это за клиника?",
    description:
      "MediBook - это медицинская организация с единым центром координации, которая выстраивает путь пациента внутри согласованной клинической структуры.",
    sections: [
      {
        type: "text",
        title: "Как мы работаем",
        body: "Мы ведем путь пациента от первого запроса до дальнейшего сопровождения в рамках единой координационной структуры. Команда клиники рассматривает каждый запрос и направляет пациента к подходящей специальности. Наша цель - не просто скорость, а правильный старт и регулярная коммуникация.",
      },
      {
        type: "text",
        title: "Команда и структура",
        body: "Врачи, координационная команда и отдел коммуникации с пациентами работают вместе. Каждое направление ведет свой клинический процесс, а центральная координация объединяет общий поток.",
      },
    ],
    actions: [
      { label: "Посмотреть врачей", href: "/doctors", variant: "default", withArrow: true },
      { label: "Посмотреть наш подход", href: "/why-medibook", variant: "outline" },
    ],
  },
  ar: {
    eyebrow: "من نحن",
    title: "ما نوع العيادة التي نحن عليها؟",
    description: "MediBook جهة رعاية صحية مركزية تنظم رحلة المريض داخل بنية عيادية منسقة.",
    sections: [
      {
        type: "text",
        title: "أسلوب عملنا",
        body: "نحن ندير رحلة المريض من أول طلب حتى المتابعة داخل هيكل تنسيقي واحد. يقوم فريق العيادة بمراجعة كل طلب وتوجيه المريض إلى التخصص المناسب. الهدف ليس السرعة فقط، بل بداية صحيحة وتواصل منتظم.",
      },
      {
        type: "text",
        title: "الفريق والبنية",
        body: "يعمل الأطباء وفريق التنسيق ووحدة تواصل المرضى معًا. يدير كل تخصص مساره السريري الخاص، بينما يحافظ مركز التنسيق العام على ترابط التدفق الكامل.",
      },
    ],
    actions: [
      { label: "عرض الأطباء", href: "/doctors", variant: "default", withArrow: true },
      { label: "عرض نهجنا", href: "/why-medibook", variant: "outline" },
    ],
  },
  es: {
    eyebrow: "Sobre nosotros",
    title: "¿Qué tipo de clínica somos?",
    description:
      "MediBook es una institución sanitaria de centro único que organiza la atención del paciente dentro de una estructura clínica coordinada.",
    sections: [
      {
        type: "text",
        title: "Cómo trabajamos",
        body: "Gestionamos el recorrido del paciente desde la primera solicitud hasta el seguimiento dentro de una sola estructura de coordinación. El equipo de la clínica revisa cada solicitud y dirige al paciente a la especialidad adecuada. El objetivo no es solo la rapidez, sino un inicio correcto y una comunicación constante.",
      },
      {
        type: "text",
        title: "Equipo y estructura",
        body: "El cuerpo médico, el equipo de coordinación y la unidad de comunicación con pacientes trabajan juntos. Cada especialidad gestiona su propio proceso clínico mientras la coordinación central mantiene unido el flujo general.",
      },
    ],
    actions: [
      { label: "Ver nuestros médicos", href: "/doctors", variant: "default", withArrow: true },
      { label: "Ver nuestro enfoque", href: "/why-medibook", variant: "outline" },
    ],
  },
} satisfies Record<string, LocalizedPageContent>;

export default function About() {
  const { lang } = useLanguage();
  return <LocalizedContentPage content={contentByLanguage[lang]} />;
}
