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
  items: Array<{
    title: string;
    description: string;
  }>;
  primaryAction: ActionLink;
  secondaryAction: ActionLink;
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
    label: "Koordinasyon destekli klinik bakim",
  },
  navigation: [
    { label: "Uzmanlik Alanlari", href: "/specialties" },
    { label: "Doktorlarimiz", href: "/doctors" },
    { label: "Randevu Sureci", href: "#appointment-process" },
    { label: "Iletisim", href: "#contact" },
  ],
  auth: {
    searchLabel: "Arama",
    signInLabel: "Giris Yap",
    requestLabel: "Randevu Talebi Olustur",
  },
  hero: {
    eyebrow: "Koordinasyon destekli klinik bakim",
    title: "Dogru uzmanliga, daha duzenli bir randevu sureciyle ulasin.",
    description:
      "Randevu talebinizi olusturun. Klinik ekibimiz ihtiyacinizi degerlendirip uygun uzmanlik ve zaman planlamasi icin sizinle iletisime gecsin.",
    primaryAction: {
      label: "Randevu Talebi Olustur",
      href: "/request-appointment",
    },
    secondaryAction: {
      label: "Doktorlarimizi Incele",
      href: "/doctors",
    },
    panelAction: {
      label: "Randevu yaklasimimiz",
      href: "#appointment-process",
    },
    panelTitle: "Randevu yaklasimimiz",
    panelItems: [
      "Ihtiyaca gore uzmanlik yonlendirmesi",
      "Talep sonrasi koordinasyon",
      "Onay ve takip bilgilendirmesi",
    ],
    image: sharedImages.hero,
    imageAlt: "Sakin bir klinik ortaminda hasta ile gorusen doktor",
  },
  quickAccess: {
    sectionId: "first-step",
    eyebrow: "Ilk Adim",
    title:
      "Nereden baslayacaginizi bilmiyorsaniz, talebinizi birakin; uygun uzmanliga birlikte yonlendirelim.",
    description:
      "Klinik ekibi, ihtiyac basliginizi ve temel tercihlerinizi degerlendirerek sizi dogru uzmanlik ve uygun surec adimina yonlendirir.",
    items: [
      {
        title: "Talebinizi birakin",
        description: "Kisa bilgi verin, ihtiyacinizi ve varsa tercihlerinizi paylasin.",
      },
      {
        title: "Uygun uzmanliga yonlendirelim",
        description: "Klinik ekibi dogru uzmanlik ve uygun doktor hattini belirlesin.",
      },
      {
        title: "Onay ve bilgilendirme ile ilerleyin",
        description: "Surec netlestiginde gerekli geri donus ve yonlendirme sizinle paylasilsin.",
      },
    ],
    primaryAction: {
      label: "Randevu Talebi Olustur",
      href: "/request-appointment",
    },
    secondaryAction: {
      label: "Randevu Surecini Gor",
      href: "#appointment-process",
    },
  },
  splitSections: [
    {
      id: "why-medibook",
      eyebrow: "Yaklasimimiz",
      title:
        "Iyi bir klinik deneyimi, yalnizca muayenede degil, surecin tamaminda hissedilir.",
      description:
        "Ilk talep anindan takip adimina kadar, klinigin isleyisini hastanin gozunden kuruyoruz. Dogru uzmanliga yonlendirme, net iletisim ve duzenli koordinasyon bu yaklasimin temelidir.",
      points: [
        "Ihtiyaca gore yonlendirme",
        "Surec boyunca net iletisim",
        "Takipte kopmayan duzen",
      ],
      note:
        "Klinik deneyimini guclu yapan sey yalnizca gorsel kalite degil, basvuru ile takip arasindaki akisin anlasilir kalmasidir.",
      action: {
        label: "Yaklasimimizi Gor",
        href: "#why-medibook",
      },
      image: sharedImages.trust,
      imageAlt: "Hasta notlari uzerinden degerlendirme yapan klinik ekip",
    },
    {
      id: "appointment-process",
      eyebrow: "Randevu Sureci",
      title:
        "Talep, degerlendirme ve onay; dogru uzmanliga ulasmak icin tek bir akista ilerler.",
      description:
        "Amac yalnizca hizli gorunmek degil; ihtiyaciniza uygun uzmanlik eslesmesini ve duzenli ilerleyisi saglamaktir. Bu yuzden randevu talebi, klinik ekibi tarafindan degerlendirilir ve dogru yonlendirme ile netlestirilir.",
      points: [
        "Talep Olusturun: Ihtiyacinizi ve temel tercihlerinizi paylasin.",
        "Degerlendirme ve Yonlendirme: Klinik ekibi uygun uzmanlik ve surec adimini belirlesin.",
        "Onay ve Takip: Uygun yonlendirme sonrasi surec netlestirilir ve gerekli bilgilendirmeler paylasilir.",
      ],
      note:
        "Bu akis, hiz vaatlerinden cok dogru uzmanlik eslesmesini ve hastaya okunabilir bir surec aktarimini onceleyecek sekilde kurulur.",
      action: {
        label: "Randevu Surecini Gor",
        href: "#appointment-process",
      },
      image: sharedImages.journey,
      imageAlt: "Masa basinda hasta surecini koordine eden klinik ekibi",
      reverse: true,
    },
  ],
  doctorPreview: {
    sectionId: "doctors-preview",
    eyebrow: "Hekim Kadromuz",
    title: "Bakim surecinin merkezinde, alaninda calisan gercek bir klinik ekip var.",
    description:
      "Uzmanlik alanlari, klinik ilgi odaklari ve kisa profilleriyle hekim kadromuzu yakindan taniyin.",
    action: {
      label: "Tum Doktorlarimizi Gor",
      href: "/doctors",
    },
    errorState: "Doktor onizlemesi su anda yuklenemiyor. Lutfen biraz sonra tekrar deneyin.",
    emptyState:
      "Aktif hekim onizlemesi su anda gosterilemiyor. Klinik ekibi guncel kadroyu yakinda yayinlayacak.",
  },
  specialtyPreview: {
    sectionId: "specialties-preview",
    eyebrow: "Uzmanlik Alanlari",
    title: "Destek verdigimiz alanlari sade ve erisilebilir bir yapi icinde inceleyin.",
    description:
      "Temel degerlendirme, takip ve one cikan klinik basliklari tek bir yapi icinde sunuyoruz. Her alan, ilgili uzmanlik ve doktor profillerine baglanir.",
    action: {
      label: "Tum Uzmanlik Alanlarini Gor",
      href: "/specialties",
    },
    errorState: "Uzmanlik onizlemesi su anda yuklenemiyor. Lutfen biraz sonra tekrar deneyin.",
    emptyState:
      "Klinik uzmanlik onizlemesi su anda sinirli. Guncel alanlar hazir oldugunda burada gosterilecek.",
  },
  faqPreview: {
    sectionId: "faq",
    eyebrow: "Sik Sorulan Sorular",
    title: "Karar vermeden once en cok merak edilen konular",
    description:
      "Randevu talebinden geri donus suresine kadar en sik sorulan basliklari tek yerde topladik.",
    action: {
      label: "Tum Sorulari Gor",
      href: "#faq",
    },
    items: [
      {
        question: "Randevu talebi nasil olusturulur?",
        answer:
          "Ana talep akisi uzerinden temel bilgilerinizi ve ihtiyacinizi paylasmaniz yeterlidir. Klinik ekibi uygun yonlendirme icin talebi degerlendirir.",
      },
      {
        question: "Talebime ne kadar surede donus yapilir?",
        answer:
          "Geri donus suresi klinik yogunluguna gore degisebilir. Amac otomatik hiz vaadi degil, dogru uzmanlik eslesmesiyle net bilgilendirme saglamaktir.",
      },
      {
        question: "Doktor secebilir miyim?",
        answer:
          "Uygun oldugu durumlarda hekim tercihinizi belirtebilirsiniz. Klinik ekibi, ihtiyaciniz ve mevcut planlamaya gore en dogru yonlendirmeyi yapar.",
      },
      {
        question: "Iptal veya erteleme nasil isler?",
        answer:
          "Iptal ya da erteleme talepleri klinik koordinasyonu uzerinden yurutulur. Uygun yeni zaman plani icin sizinle yeniden iletisime gecilir.",
      },
    ],
  },
  footer: {
    description: "Tek bir klinik icin durust, duzenli ve koordinasyon odakli bir dijital karsilama akisi.",
    columns: [
      {
        title: "Klinik",
        links: [
          { label: "Hakkimizda" },
          { label: "Doktorlarimiz", href: "/doctors" },
          { label: "Uzmanlik Alanlari", href: "/specialties" },
          { label: "Iletisim" },
        ],
      },
      {
        title: "Hasta Bilgilendirme",
        links: [
          { label: "Randevu Sureci" },
          { label: "Sik Sorulan Sorular" },
          { label: "Adres ve Ulasim" },
          { label: "Hasta Haklari" },
        ],
      },
      {
        title: "Yasal",
        links: [
          { label: "KVKK Aydinlatma Metni" },
          { label: "Veri Sahibi Basvuru" },
          { label: "Gizlilik Politikasi" },
          { label: "Cerez Politikasi" },
          { label: "Kullanim Kosullari" },
          { label: "Tibbi Bilgilendirme" },
        ],
      },
    ],
    bottomLinks: [
      { label: "Gizlilik Politikasi" },
      { label: "Kullanim Kosullari" },
      { label: "Iletisim" },
    ],
    copyright: "© 2026 MediBook. Tum haklari saklidir.",
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
    sectionId: "first-step",
    eyebrow: "First Step",
    title:
      "If you are not sure where to begin, leave your request and let the clinic guide you to the right specialty.",
    description:
      "The clinic team reviews your care need and core preferences, then helps direct you to the right specialty and next step.",
    items: [
      {
        title: "Leave your request",
        description: "Share a short note about your need and any preferences you already have.",
      },
      {
        title: "Let us guide the right specialty",
        description: "The clinic team identifies the right specialty path and the suitable doctor line.",
      },
      {
        title: "Move forward with confirmation",
        description: "Once the path is clarified, the clinic shares the next steps and the needed updates.",
      },
    ],
    primaryAction: {
      label: "Create Appointment Request",
      href: "/request-appointment",
    },
    secondaryAction: {
      label: "View Appointment Process",
      href: "#appointment-process",
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
      title: "Request, review, and confirmation move in one flow to reach the right specialty.",
      description:
        "The goal is not to look fast, but to secure the right specialty match and a more orderly process. Appointment requests are reviewed by the clinic team and clarified through the right direction.",
      points: [
        "Create a Request: Share your need and your core preferences.",
        "Review and Direction: The clinic team identifies the right specialty and next process step.",
        "Confirmation and Follow-up: After the right direction, the flow is clarified and updates are shared.",
      ],
      note:
        "The flow is built around accurate routing and readable communication, not instant-booking theater.",
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
          { label: "Specialties", href: "/specialties" },
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
