export type SpecialtyPresentation = {
  slug: string;
  imageSrc: string;
  previewText?: string;
  homepagePriority?: number;
};

const specialtyImages = {
  cardiology:
    "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=1200&q=80",
  cardiovascular:
    "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
  internalMedicine:
    "https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1200&q=80",
  dermatology:
    "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80",
  ophthalmology:
    "https://images.unsplash.com/photo-1579684453423-f84349ef60b0?auto=format&fit=crop&w=1200&q=80",
  womensHealth:
    "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80",
  pediatrics:
    "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80",
  orthopedic:
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80",
  psychology:
    "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?auto=format&fit=crop&w=1200&q=80",
  followUp:
    "https://images.unsplash.com/photo-1576671081837-49000212a370?auto=format&fit=crop&w=1200&q=80",
};

const fallbackImages = [
  specialtyImages.internalMedicine,
  specialtyImages.cardiology,
  specialtyImages.dermatology,
  specialtyImages.ophthalmology,
  specialtyImages.womensHealth,
  specialtyImages.followUp,
];

export const specialtyPresentation: SpecialtyPresentation[] = [
  {
    slug: "genel-konsultasyon",
    imageSrc: specialtyImages.internalMedicine,
    previewText: "Ilk degerlendirme ve dogru uzmanlik yonlendirmesi icin baslangic alani.",
    homepagePriority: 1,
  },
  {
    slug: "kadin-sagligi",
    imageSrc: specialtyImages.womensHealth,
    homepagePriority: 2,
  },
  {
    slug: "kadin-hastaliklari-ve-dogum",
    imageSrc: specialtyImages.womensHealth,
    homepagePriority: 2,
  },
  {
    slug: "pediatri",
    imageSrc: specialtyImages.pediatrics,
    homepagePriority: 3,
  },
  {
    slug: "dermatoloji",
    imageSrc: specialtyImages.dermatology,
    homepagePriority: 4,
  },
  {
    slug: "cildiye",
    imageSrc: specialtyImages.dermatology,
    homepagePriority: 4,
  },
  {
    slug: "psikolojik-destek",
    imageSrc: specialtyImages.psychology,
    homepagePriority: 5,
  },
  {
    slug: "kontrol-takip",
    imageSrc: specialtyImages.followUp,
    homepagePriority: 6,
  },
  {
    slug: "kardiyoloji",
    imageSrc: specialtyImages.cardiology,
    homepagePriority: 1,
  },
  {
    slug: "kalp-ve-damar-cerrahisi",
    imageSrc: specialtyImages.cardiovascular,
    homepagePriority: 2,
  },
  {
    slug: "dahiliye",
    imageSrc: specialtyImages.internalMedicine,
    homepagePriority: 3,
  },
  {
    slug: "goz-hastaliklari",
    imageSrc: specialtyImages.ophthalmology,
    homepagePriority: 4,
  },
  {
    slug: "noroloji",
    imageSrc: specialtyImages.psychology,
    homepagePriority: 5,
  },
  {
    slug: "ortopedi",
    imageSrc: specialtyImages.orthopedic,
    homepagePriority: 6,
  },
  {
    slug: "ortopedi-ve-travmatoloji",
    imageSrc: specialtyImages.orthopedic,
    homepagePriority: 6,
  },
];

export function getFallbackSpecialtyImage(index: number) {
  return fallbackImages[index % fallbackImages.length];
}
