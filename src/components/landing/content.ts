export type SupportedLanguage = "en" | "tr";

export type ActionLink = {
  label: string;
  href?: string;
};

type NavigationItem = {
  label: string;
  href: string;
};

type HeroCopy = {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: ActionLink;
  secondaryAction: ActionLink;
  panelAction: ActionLink;
  panelTitle: string;
  panelItems: string[];
  image: string;
  imageAlt: string;
};

type SplitSectionCopy = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  points: string[];
  note: string;
  action: ActionLink;
  image: string;
  imageAlt: string;
  reverse?: boolean;
};

type PreviewSectionCopy = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  action: ActionLink;
  errorState: string;
  emptyState: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

type FaqPreviewCopy = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  action: ActionLink;
  items: FaqItem[];
};

type ContactBandCopy = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  phone: string;
  address: string;
  hours: string;
  accessNote: string;
  primaryAction: ActionLink;
  secondaryAction: ActionLink;
};

type FooterColumn = {
  title: string;
  links: ActionLink[];
};

type FooterCopy = {
  description: string;
  columns: FooterColumn[];
  bottomLinks: ActionLink[];
  copyright: string;
};

export type LandingContent = {
  brand: {
    name: string;
    label: string;
  };
  navigation: NavigationItem[];
  auth: {
    signInLabel: string;
    requestLabel: string;
  };
  hero: HeroCopy;
  splitSections: SplitSectionCopy[];
  doctorPreview: PreviewSectionCopy;
  specialtyPreview: PreviewSectionCopy;
  contactBand: ContactBandCopy;
  faqPreview: FaqPreviewCopy;
  footer: FooterCopy;
};

const sharedImages = {
  hero:
    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1600&q=80",
  trust:
    "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=1200&q=80",
  journey:
    "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
};

const trContent: LandingContent = {
  brand: {
    name: "MediBook",
    label: "Koordinasyon destekli klinik bakım",
  },
  navigation: [
    { label: "Uzmanlık Alanlarımız", href: "/specialties" },
    { label: "Doktorlarımız", href: "/doctors" },
    { label: "Randevu Süreci", href: "/appointment-process" },
    { label: "İletişim", href: "/contact" },
  ],
  auth: {
    signInLabel: "Giriş Yap",
    requestLabel: "Randevu Talebi",
  },
  hero: {
    eyebrow: "Koordinasyon destekli klinik bakım",
    title: "Doğru uzmanlığa, daha düzenli bir randevu süreciyle ulaşın.",
    description:
      "Randevu talebinizi oluşturun. Klinik ekibimiz ihtiyacınızı değerlendirip uygun uzmanlık ve zaman planlaması için sizinle iletişime geçsin.",
    primaryAction: {
      label: "Randevu Talebi Oluştur",
      href: "/request-appointment",
    },
    secondaryAction: {
      label: "Doktorlarımızı İncele",
      href: "/doctors",
    },
    panelAction: {
      label: "Randevu yaklaşımımız",
      href: "/appointment-process",
    },
    panelTitle: "Randevu yaklaşımımız",
    panelItems: [
      "İhtiyaca göre uzmanlık yönlendirmesi",
      "Talep sonrası koordinasyon",
      "Onay ve takip bilgilendirmesi",
    ],
    image: sharedImages.hero,
    imageAlt: "Sakin bir klinik ortamında hasta ile görüşen doktor",
  },
  splitSections: [
    {
      id: "why-medibook",
      eyebrow: "Yaklaşımımız",
      title:
        "İyi bir klinik deneyimi, yalnızca muayenede değil, sürecin tamamında hissedilir.",
      description:
        "İlk talep anından takip adımına kadar, kliniğin işleyişini hastanın gözünden kuruyoruz. Doğru uzmanlığa yönlendirme, net iletişim ve düzenli koordinasyon bu yaklaşımın temelidir.",
      points: [
        "İhtiyaca göre yönlendirme",
        "Süreç boyunca net iletişim",
        "Takipte kopmayan düzen",
      ],
      note:
        "Klinik deneyimini güçlü yapan şey yalnızca görsel kalite değil, başvuru ile takip arasındaki akışın anlaşılır kalmasıdır.",
      action: {
        label: "Yaklaşımımızı Gör",
        href: "/why-medibook",
      },
      image: sharedImages.trust,
      imageAlt: "Hasta notları üzerinden değerlendirme yapan klinik ekip",
    },
    {
      id: "appointment-process",
      eyebrow: "Randevu Süreci",
      title:
        "Talep, değerlendirme ve onay; doğru uzmanlığa ulaşmak için tek bir akışta ilerler.",
      description:
        "Randevu talebiniz klinik ekibi tarafından değerlendirilir, uygun uzmanlık eşleşmesiyle netleştirilir.",
      points: [
        "Talep Oluşturun: İhtiyacınızı ve temel tercihlerinizi paylaşın.",
        "Değerlendirme ve Yönlendirme: Klinik ekibi uygun uzmanlık adımını belirlesin.",
        "Onay ve Takip: Süreç netleştirilir, bilgilendirmeler paylaşılır.",
      ],
      note:
        "Bu akış hız vaatlerinden çok doğru uzmanlık eşleşmesini önceleyecek şekilde kurulur.",
      action: {
        label: "Randevu Sürecini Gör",
        href: "/appointment-process",
      },
      image: sharedImages.journey,
      imageAlt: "Masa başında hasta sürecini koordine eden klinik ekibi",
      reverse: true,
    },
  ],
  doctorPreview: {
    sectionId: "doctors-preview",
    eyebrow: "Hekim Kadromuz",
    title: "Bakım sürecinin merkezinde, alanında çalışan gerçek bir klinik ekip var.",
    description:
      "Uzmanlık alanları, klinik ilgi odakları ve kısa profilleriyle hekim kadromuzu yakından tanıyın.",
    action: {
      label: "Tüm Doktorlarımızı Gör",
      href: "/doctors",
    },
    errorState: "Doktor önizlemesi şu anda yüklenemiyor. Lütfen biraz sonra tekrar deneyin.",
    emptyState:
      "Aktif hekim önizlemesi şu anda gösterilemiyor. Klinik ekibi güncel kadroyu yakında yayınlayacak.",
  },
  specialtyPreview: {
    sectionId: "specialties-preview",
    eyebrow: "Uzmanlık Alanları",
    title: "Destek verdiğimiz alanları sade ve erişilebilir bir yapı içinde inceleyin.",
    description:
      "Temel değerlendirme, takip ve öne çıkan klinik başlıkları tek bir yapı içinde sunuyoruz. Her alan, ilgili uzmanlık ve doktor profillerine bağlanır.",
    action: {
      label: "Tüm Uzmanlık Alanlarını Gör",
      href: "/specialties",
    },
    errorState: "Uzmanlık önizlemesi şu anda yüklenemiyor. Lütfen biraz sonra tekrar deneyin.",
    emptyState:
      "Klinik uzmanlık önizlemesi şu anda sınırlı. Güncel alanlar hazır olduğunda burada gösterilecek.",
  },
  contactBand: {
    sectionId: "contact-band",
    eyebrow: "İletişim ve Ulaşım",
    title: "Kliniğe ulaşım, çalışma saatleri ve temel erişim bilgileri tek yerde.",
    description:
      "Telefon, kısa adres, temel erişim notları ve güncel çalışma bilgilerine tek noktadan ulaşın.",
    phone: "+90 (212) 000 00 00",
    address: "Örnek Mahallesi, Sağlık Caddesi No:1, İstanbul",
    hours: "Hafta içi 09:00 - 18:00 · Cumartesi 09:00 - 14:00",
    accessNote: "Engelsiz giriş ve asansör erişimi mevcuttur.",
    primaryAction: {
      label: "İletişim ve Ulaşım",
      href: "/contact",
    },
    secondaryAction: {
      label: "Randevu Sürecini Gör",
      href: "/appointment-process",
    },
  },
  faqPreview: {
    sectionId: "faq",
    eyebrow: "Sık Sorulan Sorular",
    title: "Karar vermeden önce en çok merak edilen konular",
    description:
      "Randevu talebinden geri dönüş süresine kadar en sık sorulan başlıkları tek yerde topladık.",
    action: {
      label: "Tüm Soruları Gör",
      href: "/faq",
    },
    items: [
      {
        question: "Randevu talebi nasıl oluşturulur?",
        answer:
          "Ana talep akışı üzerinden temel bilgilerinizi ve ihtiyacınızı paylaşmanız yeterlidir. Klinik ekibi uygun yönlendirme için talebi değerlendirir.",
      },
      {
        question: "Talebime ne kadar sürede dönüş yapılır?",
        answer:
          "Geri dönüş süresi klinik yoğunluğuna göre değişebilir. Amaç otomatik hız vaadi değil, doğru uzmanlık eşleşmesiyle net bilgilendirme sağlamaktır.",
      },
      {
        question: "Doktor seçebilir miyim?",
        answer:
          "Uygun olduğu durumlarda hekim tercihinizi belirtebilirsiniz. Klinik ekibi, ihtiyacınız ve mevcut planlamaya göre en doğru yönlendirmeyi yapar.",
      },
      {
        question: "İptal veya erteleme nasıl işler?",
        answer:
          "İptal ya da erteleme talepleri klinik koordinasyonu üzerinden yürütülür. Uygun yeni zaman planı için sizinle yeniden iletişime geçilir.",
      },
    ],
  },
  footer: {
    description: "Tek bir klinik için dürüst, düzenli ve koordinasyon odaklı bir dijital karşılama akışı.",
    columns: [
      {
        title: "Klinik",
        links: [
          { label: "Hakkımızda", href: "/about" },
          { label: "Doktorlarımız", href: "/doctors" },
          { label: "Uzmanlık Alanları", href: "/specialties" },
          { label: "İletişim", href: "/contact" },
        ],
      },
      {
        title: "Hasta Kaynakları",
        links: [
          { label: "Randevu Süreci", href: "/appointment-process" },
          { label: "SSS", href: "/faq" },
          { label: "Tıbbi Bilgilendirme", href: "/legal/medical-disclaimer" },
          { label: "Erişilebilirlik", href: "/accessibility" },
        ],
      },
      {
        title: "Yasal",
        links: [
          { label: "KVKK Aydınlatma", href: "/legal/kvkk" },
          { label: "Gizlilik Politikası", href: "/legal/privacy-policy" },
          { label: "Çerez Politikası", href: "/legal/cookie-policy" },
          { label: "Veri Sahibi Başvuru", href: "/legal/data-subject-application" },
        ],
      },
    ],
    bottomLinks: [
      { label: "Gizlilik Politikası", href: "/legal/privacy-policy" },
      { label: "Kullanım Koşulları", href: "/legal/terms-of-use" },
      { label: "İletişim", href: "/contact" },
    ],
    copyright: "(c) 2026 MediBook. Tüm hakları saklıdır.",
  },
};

const enContent: LandingContent = {
  brand: {
    name: "MediBook",
    label: "Coordination-led clinic care",
  },
  navigation: [
    { label: "Specialties", href: "/specialties" },
    { label: "Doctors", href: "/doctors" },
    { label: "Appointment Process", href: "/appointment-process" },
    { label: "Contact", href: "/contact" },
  ],
  auth: {
    signInLabel: "Sign In",
    requestLabel: "Appointment Request",
  },
  hero: {
    eyebrow: "Coordination-led clinic care",
    title: "Reach the right specialty through a more orderly appointment flow.",
    description:
      "Create your appointment request. The clinic team reviews your needs and contacts you to coordinate the right specialty and timing.",
    primaryAction: {
      label: "Create Appointment Request",
      href: "/request-appointment",
    },
    secondaryAction: {
      label: "Review Our Doctors",
      href: "/doctors",
    },
    panelAction: {
      label: "Our appointment approach",
      href: "/appointment-process",
    },
    panelTitle: "Our appointment approach",
    panelItems: [
      "Specialty routing based on need",
      "Coordination after the request",
      "Confirmation and follow-up updates",
    ],
    image: sharedImages.hero,
    imageAlt: "Doctor speaking with a patient in a calm clinic setting",
  },
  splitSections: [
    {
      id: "why-medibook",
      eyebrow: "Our Approach",
      title:
        "A strong clinical experience should be felt not only in the visit, but across the whole process.",
      description:
        "From the first request to the follow-up step, we shape clinic operations from the patient's point of view. Routing to the right specialty, clear communication, and steady coordination define the approach.",
      points: [
        "Need-based routing",
        "Clear communication throughout the process",
        "A follow-up rhythm that does not break",
      ],
      note:
        "Clinical quality is not only what happens in the room, but how clearly the flow is carried before and after it.",
      action: {
        label: "View Our Approach",
        href: "/why-medibook",
      },
      image: sharedImages.trust,
      imageAlt: "Clinical team reviewing patient notes",
    },
    {
      id: "appointment-process",
      eyebrow: "Appointment Process",
      title: "Request, review, and confirmation move in one flow to reach the right specialty.",
      description:
        "Your appointment request is reviewed by the clinic team and clarified through the right specialty match.",
      points: [
        "Create a Request: Share your need and your core preferences.",
        "Review and Direction: The clinic team identifies the right specialty and next step.",
        "Confirmation and Follow-up: The flow is clarified and updates are shared.",
      ],
      note:
        "The flow is built around accurate routing and readable communication, not instant-booking theater.",
      action: {
        label: "View Appointment Process",
        href: "/appointment-process",
      },
      image: sharedImages.journey,
      imageAlt: "Clinic staff coordinating a patient flow",
      reverse: true,
    },
  ],
  doctorPreview: {
    sectionId: "doctors-preview",
    eyebrow: "Our Clinical Team",
    title: "There is a real clinical team at the center of the care process.",
    description:
      "Review the team through specialties, areas of focus, and short profile impressions.",
    action: {
      label: "View All Doctors",
      href: "/doctors",
    },
    errorState: "The doctor preview could not be loaded right now. Please try again shortly.",
    emptyState:
      "The active doctor preview is not available right now. The clinic team will publish the current roster here soon.",
  },
  specialtyPreview: {
    sectionId: "specialties-preview",
    eyebrow: "Specialties",
    title: "Review our care areas through a simple and accessible structure.",
    description:
      "Initial assessment, follow-up, and key clinical directions are presented in one structure. Each area connects to related specialties and doctor profiles.",
    action: {
      label: "View All Specialties",
      href: "/specialties",
    },
    errorState: "The specialty preview could not be loaded right now. Please try again shortly.",
    emptyState:
      "The clinic specialty preview is currently limited. Active areas will appear here as they are available.",
  },
  contactBand: {
    sectionId: "contact-band",
    eyebrow: "Contact & Directions",
    title: "Clinic access, working hours, and key information in one place.",
    description:
      "Phone, address, accessibility notes, and current working hours are available from a single point.",
    phone: "+90 (212) 000 00 00",
    address: "Ornek Mahallesi, Saglik Caddesi No:1, Istanbul",
    hours: "Weekdays 09:00 - 18:00 · Saturday 09:00 - 14:00",
    accessNote: "Step-free entrance and elevator access available.",
    primaryAction: {
      label: "Contact & Directions",
      href: "/contact",
    },
    secondaryAction: {
      label: "View Appointment Process",
      href: "/appointment-process",
    },
  },
  faqPreview: {
    sectionId: "faq",
    eyebrow: "Frequently Asked Questions",
    title: "The topics people ask most before deciding",
    description:
      "We gathered the most common questions in one place, from appointment requests to response times.",
    action: {
      label: "View All Questions",
      href: "/faq",
    },
    items: [
      {
        question: "How do I create an appointment request?",
        answer:
          "Use the main request flow to share your basic information and care need. The clinic team reviews the request before confirming the next step.",
      },
      {
        question: "How quickly will I receive a response?",
        answer:
          "Response time can vary with clinic capacity. The aim is not an instant promise, but a clear return after the right review.",
      },
      {
        question: "Can I choose a doctor?",
        answer:
          "You can share a preference when appropriate. The clinic team guides the request according to need and scheduling reality.",
      },
      {
        question: "How do cancellations or postponements work?",
        answer:
          "Cancellation and rescheduling requests move through clinic coordination. The team follows up with the next suitable timing.",
      },
    ],
  },
  footer: {
    description:
      "A single-clinic digital front door built around honest communication and coordinated care.",
    columns: [
      {
        title: "Clinic",
        links: [
          { label: "About", href: "/about" },
          { label: "Doctors", href: "/doctors" },
          { label: "Specialties", href: "/specialties" },
          { label: "Contact", href: "/contact" },
        ],
      },
      {
        title: "Patient Resources",
        links: [
          { label: "Appointment Process", href: "/appointment-process" },
          { label: "FAQ", href: "/faq" },
          { label: "Medical Information", href: "/legal/medical-disclaimer" },
          { label: "Accessibility", href: "/accessibility" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy Notice (KVKK)", href: "/legal/kvkk" },
          { label: "Privacy Policy", href: "/legal/privacy-policy" },
          { label: "Cookie Policy", href: "/legal/cookie-policy" },
          { label: "Data Subject Request", href: "/legal/data-subject-application" },
        ],
      },
    ],
    bottomLinks: [
      { label: "Privacy Policy", href: "/legal/privacy-policy" },
      { label: "Terms of Use", href: "/legal/terms-of-use" },
      { label: "Contact", href: "/contact" },
    ],
    copyright: "© 2026 MediBook. All rights reserved.",
  },
};

export function getLandingContent(lang: SupportedLanguage): LandingContent {
  return lang === "tr" ? trContent : enContent;
}
