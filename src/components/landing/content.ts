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

type QuickAccessCopy = {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  filters: string[];
  searchPlaceholder: string;
  helperText: string;
  panelEyebrow: string;
  panelDescription: string;
  browseAction: ActionLink;
  requestAction: ActionLink;
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
    searchLabel: string;
    signInLabel: string;
    requestLabel: string;
  };
  hero: HeroCopy;
  quickAccess: QuickAccessCopy;
  splitSections: SplitSectionCopy[];
  doctorPreview: PreviewSectionCopy;
  specialtyPreview: PreviewSectionCopy;
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
    { label: "Uzmanlık Alanları", href: "#specialties-preview" },
    { label: "Doktorlarımız", href: "/doctors" },
    { label: "Randevu Süreci", href: "#appointment-process" },
    { label: "İletişim", href: "#contact" },
  ],
  auth: {
    searchLabel: "Arama",
    signInLabel: "Giriş Yap",
    requestLabel: "Randevu Talebi Oluştur",
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
      href: "#appointment-process",
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
  quickAccess: {
    sectionId: "quick-access",
    eyebrow: "Hızlı Erişim",
    title: "Hangi konuda destek arıyorsunuz?",
    description:
      "Öne çıkan başlıklardan başlayabilir ya da doktor, branş ve yardımcı sayfalar arasında arama yapabilirsiniz.",
    filters: [
      "Genel Konsültasyon",
      "Kadın Sağlığı",
      "Pediatri",
      "Dermatoloji",
      "Psikolojik Destek",
      "Kontrol / Takip",
    ],
    searchPlaceholder: "Doktor, branş veya sayfa ara",
    helperText:
      "Arama alanı bu adımda yalnızca başlangıç keşfi içindir. Gerçek arama sonuç yönlendirmesi bu pass kapsamında eklenmedi.",
    panelEyebrow: "Öne çıkan başlangıç noktası",
    panelDescription:
      "İlk değerlendirme ve doğru yönlendirme için uygun başlangıç alanı.",
    browseAction: {
      label: "Uzmanlık Alanlarını Gör",
      href: "#specialties-preview",
    },
    requestAction: {
      label: "Randevu Talebi Oluştur",
      href: "/request-appointment",
    },
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
        href: "#why-medibook",
      },
      image: sharedImages.trust,
      imageAlt: "Hasta notları üzerinden değerlendirme yapan klinik ekip",
    },
    {
      id: "appointment-process",
      eyebrow: "Randevu Süreci",
      title: "Talep, değerlendirme ve onay tek bir akışta ilerler.",
      description:
        "Amaç yalnızca hızlı görünmek değil; doğru uzmanlık eşleşmesini ve düzenli ilerleyişi sağlamaktır. Bu yüzden randevu talebi, klinik ekibiyle koordineli biçimde değerlendirilir.",
      points: [
        "Talep Oluşturun: Temel bilgilerinizi, ihtiyaç başlığınızı ve tercihlerinizi paylaşın.",
        "Koordinasyon ve Değerlendirme: Klinik ekibi talebinizi uygun uzmanlık ve zaman planlaması açısından değerlendirir.",
        "Onay ve Takip: Uygun yönlendirme sonrası randevu akışı netleştirilir ve gerekli bilgilendirmeler paylaşılır.",
      ],
      note:
        "Bu akış, hızlı görünmekten çok doğru uzmanlık yönlendirmesini ve hastaya düzenli geri dönüşü önceler.",
      action: {
        label: "Randevu Sürecini Gör",
        href: "#appointment-process",
      },
      image: sharedImages.journey,
      imageAlt: "Masa başında hasta sürecini koordine eden klinik ekibi",
      reverse: true,
    },
  ],
  doctorPreview: {
    sectionId: "doctors-preview",
    eyebrow: "Hekim Kadromuz",
    title:
      "Bakım sürecinin merkezinde, alanında çalışan gerçek bir klinik ekip var.",
    description:
      "Uzmanlık alanları, klinik ilgi odakları ve kısa profilleriyle hekim kadromuzu yakından tanıyın.",
    action: {
      label: "Tüm Doktorlarımızı Gör",
      href: "/doctors",
    },
    errorState:
      "Doktor onizlemesi su anda yuklenemiyor. Lutfen biraz sonra tekrar deneyin.",
    emptyState:
      "Aktif hekim önizlemesi şu anda gösterilemiyor. Klinik ekibi güncel kadroyu yakında yayınlayacak.",
  },
  specialtyPreview: {
    sectionId: "specialties-preview",
    eyebrow: "Uzmanlık Alanları",
    title:
      "Destek verdiğimiz alanları sade ve erişilebilir bir yapı içinde inceleyin.",
    description:
      "Temel değerlendirme, takip ve öne çıkan klinik başlıkları tek bir yapı içinde sunuyoruz. Her alan, ilgili uzmanlık ve doktor profillerine bağlanır.",
    action: {
      label: "Tüm Uzmanlık Alanlarını Gör",
      href: "/specialties",
    },
    errorState:
      "Uzmanlik onizlemesi su anda yuklenemiyor. Lutfen biraz sonra tekrar deneyin.",
    emptyState:
      "Klinik uzmanlık önizlemesi şu anda sınırlı. Güncel alanlar hazır olduğunda burada gösterilecek.",
  },
  faqPreview: {
    sectionId: "faq",
    eyebrow: "Sık Sorulan Sorular",
    title: "Karar vermeden önce en çok merak edilen konular",
    description:
      "Randevu talebinden geri dönüş süresine kadar en sık sorulan başlıkları tek yerde topladık.",
    action: {
      label: "Tüm Soruları Gör",
      href: "#faq",
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
    description:
      "Tek bir klinik için dürüst, düzenli ve koordinasyon odaklı bir dijital karşılama akışı.",
    columns: [
      {
        title: "Klinik",
        links: [
          { label: "Hakkımızda" },
          { label: "Doktorlarımız", href: "/doctors" },
          { label: "Uzmanlık Alanları" },
          { label: "İletişim" },
        ],
      },
      {
        title: "Hasta Bilgilendirme",
        links: [
          { label: "Randevu Süreci" },
          { label: "Sık Sorulan Sorular" },
          { label: "Adres ve Ulaşım" },
          { label: "Hasta Hakları" },
        ],
      },
      {
        title: "Yasal",
        links: [
          { label: "KVKK Aydınlatma Metni" },
          { label: "Veri Sahibi Başvuru" },
          { label: "Gizlilik Politikası" },
          { label: "Çerez Politikası" },
          { label: "Kullanım Koşulları" },
          { label: "Tıbbi Bilgilendirme" },
        ],
      },
    ],
    bottomLinks: [
      { label: "Gizlilik Politikası" },
      { label: "Kullanım Koşulları" },
      { label: "İletişim" },
    ],
    copyright: "© 2026 MediBook. Tüm hakları saklıdır.",
  },
};

const enContent: LandingContent = {
  brand: {
    name: "MediBook",
    label: "Coordination-led clinic care",
  },
  navigation: [
    { label: "Specialties", href: "#specialties-preview" },
    { label: "Doctors", href: "/doctors" },
    { label: "Appointment Process", href: "#appointment-process" },
    { label: "Contact", href: "#contact" },
  ],
  auth: {
    searchLabel: "Search",
    signInLabel: "Sign In",
    requestLabel: "Create Appointment Request",
  },
  hero: {
    eyebrow: "Coordination-led clinic care",
    title: "Reach the right specialty through a more orderly appointment flow.",
    description:
      "Create your appointment request. The clinic team reviews your need and contacts you to coordinate the right specialty and timing.",
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
      href: "#appointment-process",
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
  quickAccess: {
    sectionId: "quick-access",
    eyebrow: "Quick Access",
    title: "What kind of support are you looking for?",
    description:
      "Start with highlighted care topics or browse between doctors, specialties, and supporting pages.",
    filters: [
      "General Consultation",
      "Women's Health",
      "Pediatrics",
      "Dermatology",
      "Psychological Support",
      "Control / Follow-up",
    ],
    searchPlaceholder: "Search doctor, specialty, or page",
    helperText:
      "The search field stays visual in this pass. It does not introduce real result routing yet.",
    panelEyebrow: "Featured starting point",
    panelDescription:
      "A strong starting point for initial evaluation and the right specialty direction.",
    browseAction: {
      label: "View Specialties",
      href: "#specialties-preview",
    },
    requestAction: {
      label: "Create Appointment Request",
      href: "/request-appointment",
    },
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
        href: "#why-medibook",
      },
      image: sharedImages.trust,
      imageAlt: "Clinical team reviewing patient notes",
    },
    {
      id: "appointment-process",
      eyebrow: "Appointment Process",
      title: "Request, review, and confirmation move in one clear flow.",
      description:
        "The goal is not to look fast, but to secure the right specialty match and a more orderly process. Appointment requests are reviewed in coordination with the clinic team.",
      points: [
        "Create a Request: Share your core information, need, and preferences.",
        "Coordination and Review: The clinic team reviews your request for specialty fit and scheduling.",
        "Confirmation and Follow-up: After routing, the appointment flow is clarified and updates are shared.",
      ],
      note:
        "The flow is designed around accurate routing and readable communication, not instant-booking theater.",
      action: {
        label: "View Appointment Process",
        href: "#appointment-process",
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
    errorState:
      "The doctor preview could not be loaded right now. Please try again shortly.",
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
    errorState:
      "The specialty preview could not be loaded right now. Please try again shortly.",
    emptyState:
      "The clinic specialty preview is currently limited. Active areas will appear here as they are available.",
  },
  faqPreview: {
    sectionId: "faq",
    eyebrow: "Frequently Asked Questions",
    title: "The topics people ask most before deciding",
    description:
      "We gathered the most common questions in one place, from appointment requests to response times.",
    action: {
      label: "View All Questions",
      href: "#faq",
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
          { label: "About" },
          { label: "Doctors", href: "/doctors" },
          { label: "Specialties" },
          { label: "Contact" },
        ],
      },
      {
        title: "Patient Information",
        links: [
          { label: "Appointment Process" },
          { label: "FAQ" },
          { label: "Address and Directions" },
          { label: "Patient Rights" },
        ],
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy Notice" },
          { label: "Data Subject Request" },
          { label: "Privacy Policy" },
          { label: "Cookie Policy" },
          { label: "Terms of Use" },
          { label: "Medical Information" },
        ],
      },
    ],
    bottomLinks: [
      { label: "Privacy Policy" },
      { label: "Terms of Use" },
      { label: "Contact" },
    ],
    copyright: "© 2026 MediBook. All rights reserved.",
  },
};

export function getLandingContent(lang: SupportedLanguage): LandingContent {
  return lang === "tr" ? trContent : enContent;
}
