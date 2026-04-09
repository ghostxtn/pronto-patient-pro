import type { Language } from "@/i18n/config";

const specialtyLocalization: Record<
  string,
  {
    enName: string;
    trName: string;
    enDescription?: string;
    trDescription?: string;
  }
> = {
  "genel-konsultasyon": {
    enName: "General Consultation",
    trName: "Genel Konsultasyon",
    enDescription: "A starting point for initial assessment and appropriate specialty direction.",
    trDescription: "Ilk degerlendirme ve dogru uzmanlik yonlendirmesi icin baslangic alani.",
  },
  "kardiyoloji": {
    enName: "Cardiology",
    trName: "Kardiyoloji",
    enDescription: "Specialist evaluation and follow-up for heart and circulation health.",
  },
  "dahiliye": {
    enName: "Internal Medicine",
    trName: "Dahiliye",
    enDescription: "Comprehensive adult care, assessment, and care coordination.",
  },
  "cildiye": {
    enName: "Dermatology",
    trName: "Cildiye",
    enDescription: "Skin-focused evaluation, treatment planning, and routine follow-up.",
  },
  "dermatoloji": {
    enName: "Dermatology",
    trName: "Dermatoloji",
    enDescription: "Skin-focused evaluation, treatment planning, and routine follow-up.",
  },
  "kadin-sagligi": {
    enName: "Women's Health",
    trName: "Kadin Sagligi",
    enDescription: "Care coordination for routine women's health needs and follow-up.",
  },
  "kadin-hastaliklari-ve-dogum": {
    enName: "Obstetrics and Gynecology",
    trName: "Kadin Hastaliklari ve Dogum",
    enDescription: "Specialist care for women's health, gynecologic needs, and pregnancy follow-up.",
  },
  "pediatri": {
    enName: "Pediatrics",
    trName: "Pediatri",
    enDescription: "Child-focused assessment, routine care, and family-guided follow-up.",
  },
  "goz-hastaliklari": {
    enName: "Ophthalmology",
    trName: "Goz Hastaliklari",
    enDescription: "Evaluation and follow-up support for eye health and vision-related needs.",
  },
  "noroloji": {
    enName: "Neurology",
    trName: "Noroloji",
    enDescription: "Assessment and care planning for neurological symptoms and follow-up needs.",
  },
  "ortopedi": {
    enName: "Orthopedics",
    trName: "Ortopedi",
    enDescription: "Care for bones, joints, mobility, and musculoskeletal recovery.",
  },
  "ortopedi-ve-travmatoloji": {
    enName: "Orthopedics and Traumatology",
    trName: "Ortopedi ve Travmatoloji",
    enDescription: "Care planning for orthopedic conditions, injuries, and recovery.",
  },
};

export function toHomepageSlug(value: string) {
  return value
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getLocalizedSpecialtyCopy(
  specialtyName: string | undefined | null,
  slug: string,
  lang: Language,
) {
  const normalizedName = specialtyName?.trim() || "";
  const localized = specialtyLocalization[slug];

  if (!localized) {
    return {
      name: normalizedName,
      description: undefined,
    };
  }

  return {
    name: lang === "tr" ? localized.trName : localized.enName,
    description: lang === "tr" ? localized.trDescription : localized.enDescription,
  };
}
