import LocalizedContentPage, { type LocalizedPageContent } from "@/components/landing/LocalizedContentPage";
import { useLanguage } from "@/contexts/LanguageContext";

const contentByLanguage = {
  en: {
    eyebrow: "Location and Access",
    title: "How do you reach the clinic?",
    description: "Address, public transport notes, and physical access details.",
    sections: [
      { type: "text", title: "Address", body: "Ornek Mahallesi, Saglik Caddesi No:1, Besiktas / Istanbul" },
      { type: "list", title: "Transport Information", items: ["Metro: The nearest station details will be updated.", "Bus: The relevant route information will be updated.", "Parking: Limited parking is available at the building entrance."] },
      { type: "text", title: "Working Hours", body: "Weekdays 09:00 - 18:00 · Saturday 09:00 - 14:00 · Sunday closed" },
      { type: "text", title: "Accessibility", body: "The clinic entrance is step-free and suitable for accessible entry. An elevator is available. Please contact us in advance for additional access needs.", highlighted: true },
    ],
    actions: [
      { label: "Contact", href: "/contact", variant: "outline" },
      { label: "See the Appointment Process", href: "/appointment-process", variant: "outline" },
    ],
  },
  tr: {
    eyebrow: "Adres ve Ulaşım",
    title: "Kliniğe nasıl gelirsiniz?",
    description: "Adres, toplu taşıma bilgisi ve fiziksel erişim detayları.",
    sections: [
      { type: "text", title: "Adres", body: "Örnek Mahallesi, Sağlık Caddesi No:1, Beşiktaş / İstanbul" },
      { type: "list", title: "Ulaşım Bilgisi", items: ["Metro: En yakın istasyon bilgisi güncellenecektir.", "Otobüs: İlgili hat bilgisi güncellenecektir.", "Otopark: Bina girişinde sınırlı otopark alanı mevcuttur."] },
      { type: "text", title: "Çalışma Saatleri", body: "Hafta içi 09:00 - 18:00 · Cumartesi 09:00 - 14:00 · Pazar kapalı" },
      { type: "text", title: "Erişilebilirlik", body: "Klinik girişi basamaksız (engelsiz) erişime uygundur. Asansör mevcuttur. Ek erişim ihtiyaçlarınız için lütfen önceden iletişime geçin.", highlighted: true },
    ],
    actions: [
      { label: "İletişim", href: "/contact", variant: "outline" },
      { label: "Randevu Sürecini Gör", href: "/appointment-process", variant: "outline" },
    ],
  },
  fr: {
    eyebrow: "Adresse et accès",
    title: "Comment rejoindre la clinique ?",
    description: "Adresse, informations de transport et détails d'accès physique.",
    sections: [
      { type: "text", title: "Adresse", body: "Ornek Mahallesi, Saglik Caddesi No:1, Besiktas / Istanbul" },
      { type: "list", title: "Informations de transport", items: ["Métro : les informations sur la station la plus proche seront mises à jour.", "Bus : les informations sur la ligne concernée seront mises à jour.", "Parking : un nombre limité de places est disponible à l'entrée du bâtiment."] },
      { type: "text", title: "Horaires d'ouverture", body: "En semaine 09:00 - 18:00 · Samedi 09:00 - 14:00 · Dimanche fermé" },
      { type: "text", title: "Accessibilité", body: "L'entrée de la clinique est sans marche et adaptée à un accès accessible. Un ascenseur est disponible. Merci de nous contacter à l'avance pour tout besoin d'accès supplémentaire.", highlighted: true },
    ],
    actions: [
      { label: "Contact", href: "/contact", variant: "outline" },
      { label: "Voir le processus de rendez-vous", href: "/appointment-process", variant: "outline" },
    ],
  },
  ru: {
    eyebrow: "Адрес и доступ",
    title: "Как добраться до клиники?",
    description: "Адрес, сведения о транспорте и детали физической доступности.",
    sections: [
      { type: "text", title: "Адрес", body: "Ornek Mahallesi, Saglik Caddesi No:1, Besiktas / Istanbul" },
      { type: "list", title: "Транспортная информация", items: ["Метро: информация о ближайшей станции будет обновлена.", "Автобус: информация о соответствующем маршруте будет обновлена.", "Парковка: у входа в здание доступно ограниченное количество парковочных мест."] },
      { type: "text", title: "Часы работы", body: "Будни 09:00 - 18:00 · Суббота 09:00 - 14:00 · Воскресенье закрыто" },
      { type: "text", title: "Доступность", body: "Вход в клинику без ступеней и подходит для доступного входа. Есть лифт. Пожалуйста, свяжитесь с нами заранее, если вам нужен дополнительный доступ.", highlighted: true },
    ],
    actions: [
      { label: "Контакты", href: "/contact", variant: "outline" },
      { label: "Посмотреть процесс записи", href: "/appointment-process", variant: "outline" },
    ],
  },
  ar: {
    eyebrow: "العنوان والوصول",
    title: "كيف تصل إلى العيادة؟",
    description: "العنوان وملاحظات المواصلات وتفاصيل الوصول الفعلي.",
    sections: [
      { type: "text", title: "العنوان", body: "Ornek Mahallesi, Saglik Caddesi No:1, Besiktas / Istanbul" },
      { type: "list", title: "معلومات المواصلات", items: ["المترو: سيتم تحديث معلومات أقرب محطة.", "الحافلة: سيتم تحديث معلومات الخط المناسب.", "موقف السيارات: يتوفر موقف محدود عند مدخل المبنى."] },
      { type: "text", title: "ساعات العمل", body: "أيام الأسبوع 09:00 - 18:00 · السبت 09:00 - 14:00 · الأحد مغلق" },
      { type: "text", title: "إمكانية الوصول", body: "مدخل العيادة خالٍ من الدرج ومناسب للوصول الميسر. يتوفر مصعد. يرجى التواصل معنا مسبقًا إذا كانت لديكم احتياجات وصول إضافية.", highlighted: true },
    ],
    actions: [
      { label: "اتصل بنا", href: "/contact", variant: "outline" },
      { label: "عرض عملية الموعد", href: "/appointment-process", variant: "outline" },
    ],
  },
  es: {
    eyebrow: "Dirección y acceso",
    title: "¿Cómo llegar a la clínica?",
    description: "Dirección, información de transporte y detalles de acceso físico.",
    sections: [
      { type: "text", title: "Dirección", body: "Ornek Mahallesi, Saglik Caddesi No:1, Besiktas / Istanbul" },
      { type: "list", title: "Información de transporte", items: ["Metro: la información de la estación más cercana se actualizará.", "Autobús: la información de la línea correspondiente se actualizará.", "Estacionamiento: hay plazas limitadas en la entrada del edificio."] },
      { type: "text", title: "Horario de atención", body: "Días laborables 09:00 - 18:00 · Sábado 09:00 - 14:00 · Domingo cerrado" },
      { type: "text", title: "Accesibilidad", body: "La entrada de la clínica no tiene escalones y es adecuada para acceso accesible. Hay ascensor. Póngase en contacto con nosotros con antelación si necesita apoyo adicional de acceso.", highlighted: true },
    ],
    actions: [
      { label: "Contacto", href: "/contact", variant: "outline" },
      { label: "Ver el proceso de cita", href: "/appointment-process", variant: "outline" },
    ],
  },
} satisfies Record<string, LocalizedPageContent>;

export default function Location() {
  const { lang } = useLanguage();
  return <LocalizedContentPage content={contentByLanguage[lang]} />;
}
