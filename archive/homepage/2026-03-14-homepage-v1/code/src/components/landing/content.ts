export type SupportedLanguage = "en" | "tr";

type ActionLink = {
  label: string;
  href: string;
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
  playLabel: string;
  panelTitle: string;
  panelItems: string[];
  image: string;
  imageAlt: string;
};

type QuickAccessCopy = {
  eyebrow: string;
  title: string;
  description: string;
  filters: string[];
  searchPlaceholder: string;
  helperText: string;
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

type ShowcaseCard = {
  title: string;
  subtitle: string;
  image: string;
};

type ShowcaseCopy = {
  eyebrow: string;
  title: string;
  description: string;
  action: ActionLink;
  cards: ShowcaseCard[];
};

type CareColumn = {
  title: string;
  links: string[];
};

type CareAreasCopy = {
  eyebrow: string;
  title: string;
  description: string;
  columns: CareColumn[];
  action: ActionLink;
};

type FooterCard = {
  title: string;
  description: string;
  href: string;
};

type FooterColumn = {
  title: string;
  links: ActionLink[];
};

type FooterCopy = {
  eyebrow: string;
  title: string;
  description: string;
  cards: FooterCard[];
  columns: FooterColumn[];
  legal: string[];
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
  showcase: ShowcaseCopy;
  careAreas: CareAreasCopy;
  footer: FooterCopy;
};

const sharedImages = {
  hero:
    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1600&q=80",
  trust:
    "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=1200&q=80",
  journey:
    "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80",
  consult:
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
  waiting:
    "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=1200&q=80",
  treatment:
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
  pediatrics:
    "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1200&q=80",
  diagnostics:
    "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80",
  dermatology:
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&q=80",
};

const trContent: LandingContent = {
  brand: {
    name: "MediBook",
    label: "Koordine klinik deneyimi",
  },
  navigation: [
    { label: "Hizmetler", href: "#services" },
    { label: "Doktorlarımız", href: "/doctors" },
    { label: "Süreç", href: "#journey" },
    { label: "Bakım Alanları", href: "#care-areas" },
    { label: "İletişim", href: "#contact" },
  ],
  auth: {
    searchLabel: "Arama",
    signInLabel: "Giriş Yap",
    requestLabel: "Randevu Talebi",
  },
  hero: {
    eyebrow: "Premium clinical minimal + institutional trust",
    title: "Uzman bakıma net erişim.",
    description:
      "Randevu talebinden takip sürecine kadar, hastalar ve klinik ekipleri daha net ve düzenli bir bakım akışında ilerler.",
    primaryAction: { label: "Randevu Talebi Oluştur", href: "/auth?tab=signup" },
    secondaryAction: { label: "Hizmetleri İncele", href: "#services" },
    playLabel: "Bakım yaklaşımını keşfedin",
    panelTitle: "Hastaların bekleyebileceği yapı",
    panelItems: [
      "Uzmanlık bazlı doğru yönlendirme",
      "Aynı gün içinde geri dönüş kurgusu",
      "Takip randevularında tutarlı koordinasyon",
    ],
    image: sharedImages.hero,
    imageAlt: "Doctor speaking with a patient in a calm clinical setting",
  },
  quickAccess: {
    eyebrow: "Hızlı yönlendirme",
    title: "Hangi hizmeti arıyorsunuz?",
    description:
      "Görsel anlatıdan hemen sonra işe yarayan bir giriş noktası veriyoruz. Popüler alanlar taranabiliyor, hasta da doğrudan uzman aramaya geçebiliyor.",
    filters: [
      "Genel Muayene",
      "Kadın Sağlığı",
      "Çocuk Sağlığı",
      "Dermatoloji",
      "Psikolojik Danışmanlık",
      "Kontrol Randevusu",
    ],
    searchPlaceholder: "Doktor, branş veya hizmet arayın",
    helperText: "Arama girişi, uzman listesine geçiş için kullanılır. Hızlı başvuru için doğrudan talep oluşturabilirsiniz.",
    browseAction: { label: "Uzmanları Gör", href: "/doctors" },
    requestAction: { label: "Hızlı Talep Oluştur", href: "/auth?tab=signup" },
  },
  splitSections: [
    {
      id: "services",
      eyebrow: "Güven ve uzmanlık",
      title: "Güçlü bir bakım deneyimi koordinasyonla başlar.",
      description:
        "Başvuru trafiğini sadeleştiren, doktoru görünür kılan ve hastaya net beklenti veren bir yapı kuruyoruz. Premium his burada efektlerden değil, ritimden geliyor.",
      points: [
        "Uzmanlık alanlarına göre temiz yönlendirme",
        "Hasta talebi ile klinik geri dönüşünü aynı akışta toplama",
        "Kısa, açıklayıcı ve kurumsal bir içerik dili",
      ],
      note: "Sakin görsel dil, ciddi tipografi ve dürüst bilgi mimarisi birlikte çalışır.",
      action: { label: "Uzmanlıkları Gör", href: "/doctors" },
      image: sharedImages.trust,
      imageAlt: "Doctor consulting with patient over medical notes",
    },
    {
      id: "journey",
      eyebrow: "Hasta yolculuğu",
      title: "Talep, onay ve takip tek bir net süreçte ilerler.",
      description:
        "Klinik operasyonu için önemli olan şey sadece randevu almak değil. Hastanın ne zaman bilgilendirildiği, hangi branşa geçtiği ve kontrol sürecine nasıl bağlandığı da aynı derecede kritik.",
      points: [
        "Talep oluşturma ve sekreter koordinasyonu",
        "Onay sonrası açık bilgilendirme akışı",
        "Kontrol ve takip randevuları için devamlılık hissi",
      ],
      note: "Sağlıkta güven, stabil ve okunabilir süreçlerden doğar.",
      action: { label: "Hasta Sürecini İncele", href: "#care-areas" },
      image: sharedImages.journey,
      imageAlt: "Clinical staff coordinating patient care at a desk",
      reverse: true,
    },
  ],
  showcase: {
    eyebrow: "Klinik yüzeyi",
    title: "Hastaların karşılaştığı bakım alanları",
    description:
      "Tek bir landing hissi yerine gerçek bir kurum hissi kurmak için bakım ortamlarını ve uzmanlık katmanlarını görsel olarak açıyoruz.",
    action: { label: "Doktorlarımızı İncele", href: "/doctors" },
    cards: [
      {
        title: "Konsültasyon Odaları",
        subtitle: "Sakin, net ve hekim odaklı görüşme alanları",
        image: sharedImages.consult,
      },
      {
        title: "Bekleme ve Karşılama",
        subtitle: "Yumuşak geçişli, düşük gürültülü hasta deneyimi",
        image: sharedImages.waiting,
      },
      {
        title: "Tedavi ve Uygulama",
        subtitle: "Steril süreçler için kontrollü bakım altyapısı",
        image: sharedImages.treatment,
      },
      {
        title: "Çocuk Sağlığı",
        subtitle: "Ailelere güven veren daha yumuşak temas noktaları",
        image: sharedImages.pediatrics,
      },
      {
        title: "Tetkik Sonrası Değerlendirme",
        subtitle: "Sonuçları hızla anlamlandıran takip görüşmeleri",
        image: sharedImages.diagnostics,
      },
      {
        title: "Cilt ve Danışmanlık",
        subtitle: "Yakın takip gerektiren alanlar için düzenli koordinasyon",
        image: sharedImages.dermatology,
      },
    ],
  },
  careAreas: {
    eyebrow: "Öne çıkan hizmet alanları",
    title: "Karmaşa olmadan düzenli bir hizmet görünümü",
    description:
      "Kart yığını yerine kolay okunur link listeleri kullanıyoruz. Böylece kullanıcı aradığını daha hızlı buluyor, kurum da genişlik hissini daha dürüst veriyor.",
    columns: [
      {
        title: "Temel Hizmetler",
        links: [
          "Genel Muayene",
          "Kontrol Randevuları",
          "Check-up Planlaması",
          "Aşı ve Koruyucu Sağlık",
        ],
      },
      {
        title: "Uzmanlık Alanları",
        links: [
          "Kadın Sağlığı",
          "Çocuk Sağlığı",
          "Dermatoloji",
          "Psikolojik Danışmanlık",
        ],
      },
      {
        title: "Takip Süreçleri",
        links: [
          "Kronik Hastalık Takibi",
          "Laboratuvar Sonuç Değerlendirmesi",
          "Tetkik Sonrası Değerlendirme",
          "Beslenme Danışmanlığı",
        ],
      },
    ],
    action: { label: "Tüm Doktorları Gör", href: "/doctors" },
  },
  footer: {
    eyebrow: "Kurumsal derinlik",
    title: "Güveni sadece hero’da değil, her giriş noktasında da kurun.",
    description:
      "Footer, sitenin geri kalanını taşıyan kurumsal omurga gibi çalışır. Çok kolonlu yapı, net giriş noktaları ve sakin CTA dozajı premium-klinik hissini tamamlar.",
    cards: [
      {
        title: "Doktor Bul",
        description: "Uzmanlık alanlarına göre görünür, temiz bir keşif akışı.",
        href: "/doctors",
      },
      {
        title: "Hizmetleri İncele",
        description: "Muayene, takip ve değerlendirme alanlarını tarayın.",
        href: "#care-areas",
      },
      {
        title: "Randevu Talebi Oluştur",
        description: "Hızlı başvuru ile klinik ekibine doğrudan ulaşın.",
        href: "/auth?tab=signup",
      },
    ],
    columns: [
      {
        title: "Klinik",
        links: [
          { label: "Hakkımızda", href: "#services" },
          { label: "Doktorlarımız", href: "/doctors" },
          { label: "İletişim", href: "#contact" },
          { label: "Lokasyon", href: "#care-areas" },
        ],
      },
      {
        title: "Hizmetler",
        links: [
          { label: "Branşlar", href: "#care-areas" },
          { label: "Muayene Süreci", href: "#journey" },
          { label: "Kontrol Randevusu", href: "#journey" },
          { label: "Sık Sorulan Sorular", href: "#contact" },
        ],
      },
      {
        title: "Hastalar İçin",
        links: [
          { label: "Randevu Talebi", href: "/auth?tab=signup" },
          { label: "Hasta Portalı", href: "/auth" },
          { label: "Belgeler", href: "#contact" },
          { label: "KVKK / Gizlilik", href: "#contact" },
        ],
      },
      {
        title: "Kurumsal",
        links: [
          { label: "İş Birlikleri", href: "#contact" },
          { label: "Kariyer", href: "#contact" },
          { label: "Duyurular", href: "#contact" },
          { label: "Politika ve Koşullar", href: "#contact" },
        ],
      },
    ],
    legal: ["Gizlilik", "Şartlar", "İletişim"],
    copyright: "© 2026 MediBook. Tüm hakları saklıdır.",
  },
};

const enContent: LandingContent = {
  brand: {
    name: "MediBook",
    label: "Coordinated clinical experience",
  },
  navigation: [
    { label: "Services", href: "#services" },
    { label: "Doctors", href: "/doctors" },
    { label: "Journey", href: "#journey" },
    { label: "Care Areas", href: "#care-areas" },
    { label: "Contact", href: "#contact" },
  ],
  auth: {
    searchLabel: "Search",
    signInLabel: "Sign In",
    requestLabel: "Appointment Request",
  },
  hero: {
    eyebrow: "Premium clinical minimal + institutional trust",
    title: "Clear access to specialist care.",
    description:
      "From appointment request to follow-up, patients and clinic teams can move through a clearer, more structured care flow.",
    primaryAction: { label: "Create Appointment Request", href: "/auth?tab=signup" },
    secondaryAction: { label: "Review Services", href: "#services" },
    playLabel: "Explore the care approach",
    panelTitle: "What patients can expect",
    panelItems: [
      "Specialty-led patient routing",
      "Same-day return flow for incoming requests",
      "Consistent follow-up coordination after visits",
    ],
    image: sharedImages.hero,
    imageAlt: "Doctor speaking with a patient in a calm clinical setting",
  },
  quickAccess: {
    eyebrow: "Quick access",
    title: "Which service are you looking for?",
    description:
      "The page moves from atmosphere to utility immediately. Popular care areas are scannable, while the patient can move straight into specialist discovery.",
    filters: [
      "General Consultation",
      "Women's Health",
      "Pediatrics",
      "Dermatology",
      "Psychological Support",
      "Follow-up Visit",
    ],
    searchPlaceholder: "Search doctors, specialties, or services",
    helperText: "Search routes people into specialist discovery. If the need is already clear, use the direct request path instead.",
    browseAction: { label: "Browse Specialists", href: "/doctors" },
    requestAction: { label: "Create Quick Request", href: "/auth?tab=signup" },
  },
  splitSections: [
    {
      id: "services",
      eyebrow: "Trust and expertise",
      title: "A stronger care experience starts with coordination.",
      description:
        "We focus on a homepage that makes specialists legible, keeps intake structured, and gives patients honest expectations. The premium feel comes from rhythm rather than performance.",
      points: [
        "Clear specialty-based routing",
        "A single flow for patient request and clinic response",
        "Short, explanatory, institutional copywriting",
      ],
      note: "Quiet visual language, serious typography, and readable information architecture carry the authority.",
      action: { label: "View Specialties", href: "/doctors" },
      image: sharedImages.trust,
      imageAlt: "Doctor consulting with patient over medical notes",
    },
    {
      id: "journey",
      eyebrow: "Patient journey",
      title: "Request, confirmation, and follow-up belong to one clear process.",
      description:
        "For a clinic, success is not only about booking. It is also about when the patient gets informed, how they move to the right specialty, and how continuity is preserved after the visit.",
      points: [
        "Request intake and front-desk coordination",
        "Clear confirmation and information flow",
        "Continuity across control and follow-up appointments",
      ],
      note: "In healthcare, trust grows from stable and readable processes.",
      action: { label: "Review the Patient Flow", href: "#care-areas" },
      image: sharedImages.journey,
      imageAlt: "Clinical staff coordinating patient care at a desk",
      reverse: true,
    },
  ],
  showcase: {
    eyebrow: "Clinical surface",
    title: "The care spaces patients encounter",
    description:
      "Instead of a generic landing-page facade, the layout opens up the real care surface of the institution through spaces, specialties, and calm visual evidence.",
    action: { label: "Review Our Doctors", href: "/doctors" },
    cards: [
      {
        title: "Consultation Suites",
        subtitle: "Quiet rooms designed for focused physician-patient dialogue",
        image: sharedImages.consult,
      },
      {
        title: "Reception and Waiting",
        subtitle: "Low-noise arrival moments with softer transitions",
        image: sharedImages.waiting,
      },
      {
        title: "Treatment Rooms",
        subtitle: "Controlled infrastructure for sterile clinical routines",
        image: sharedImages.treatment,
      },
      {
        title: "Pediatric Care",
        subtitle: "Gentler touchpoints that reassure both children and families",
        image: sharedImages.pediatrics,
      },
      {
        title: "Post-Test Reviews",
        subtitle: "Follow-up conversations that clarify next clinical steps",
        image: sharedImages.diagnostics,
      },
      {
        title: "Dermatology Guidance",
        subtitle: "Structured coordination for close-monitoring specialties",
        image: sharedImages.dermatology,
      },
    ],
  },
  careAreas: {
    eyebrow: "Featured service areas",
    title: "An organized service overview without clutter",
    description:
      "Instead of stacking oversized cards, the page uses calm link lists. Users find what they need faster, while the clinic still communicates breadth and structure.",
    columns: [
      {
        title: "Core Services",
        links: [
          "General Consultation",
          "Follow-up Visits",
          "Check-up Planning",
          "Vaccination and Preventive Care",
        ],
      },
      {
        title: "Specialty Areas",
        links: [
          "Women's Health",
          "Pediatrics",
          "Dermatology",
          "Psychological Support",
        ],
      },
      {
        title: "Continuity Care",
        links: [
          "Chronic Condition Follow-up",
          "Lab Result Review",
          "Post-Diagnostic Evaluation",
          "Nutrition Counseling",
        ],
      },
    ],
    action: { label: "See All Doctors", href: "/doctors" },
  },
  footer: {
    eyebrow: "Institutional depth",
    title: "Build trust beyond the hero, at every entry point.",
    description:
      "The footer should behave like the institutional backbone of the site: multi-column structure, clear routes, and restrained calls to action that complete the premium-clinic tone.",
    cards: [
      {
        title: "Find a Doctor",
        description: "A clear discovery path organized by specialties and care needs.",
        href: "/doctors",
      },
      {
        title: "Review Services",
        description: "Scan consultation, follow-up, and evaluation areas with ease.",
        href: "#care-areas",
      },
      {
        title: "Create Appointment Request",
        description: "Reach the clinic team directly through a focused intake path.",
        href: "/auth?tab=signup",
      },
    ],
    columns: [
      {
        title: "Clinic",
        links: [
          { label: "About", href: "#services" },
          { label: "Doctors", href: "/doctors" },
          { label: "Contact", href: "#contact" },
          { label: "Location", href: "#care-areas" },
        ],
      },
      {
        title: "Services",
        links: [
          { label: "Specialties", href: "#care-areas" },
          { label: "Consultation Flow", href: "#journey" },
          { label: "Follow-up Visits", href: "#journey" },
          { label: "FAQ", href: "#contact" },
        ],
      },
      {
        title: "For Patients",
        links: [
          { label: "Appointment Request", href: "/auth?tab=signup" },
          { label: "Patient Portal", href: "/auth" },
          { label: "Documents", href: "#contact" },
          { label: "Privacy", href: "#contact" },
        ],
      },
      {
        title: "Corporate",
        links: [
          { label: "Partnerships", href: "#contact" },
          { label: "Careers", href: "#contact" },
          { label: "Announcements", href: "#contact" },
          { label: "Policies and Terms", href: "#contact" },
        ],
      },
    ],
    legal: ["Privacy", "Terms", "Contact"],
    copyright: "© 2026 MediBook. All rights reserved.",
  },
};

export function getLandingContent(lang: SupportedLanguage): LandingContent {
  return lang === "tr" ? trContent : enContent;
}
