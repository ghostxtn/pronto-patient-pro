export type SpecialtyPresentation = {
  slug: string;
  imageSrc: string;
  previewText?: string;
  homepagePriority?: number;
};

const fallbackImages = [
  "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80",
];

export const specialtyPresentation: SpecialtyPresentation[] = [
  {
    slug: "genel-konsultasyon",
    imageSrc: fallbackImages[0],
    previewText: "İlk değerlendirme ve doğru uzmanlık yönlendirmesi için başlangıç alanı.",
    homepagePriority: 1,
  },
  {
    slug: "kadin-sagligi",
    imageSrc: fallbackImages[1],
    homepagePriority: 2,
  },
  {
    slug: "pediatri",
    imageSrc: fallbackImages[2],
    homepagePriority: 3,
  },
  {
    slug: "dermatoloji",
    imageSrc: fallbackImages[3],
    homepagePriority: 4,
  },
  {
    slug: "psikolojik-destek",
    imageSrc: fallbackImages[4],
    homepagePriority: 5,
  },
  {
    slug: "kontrol-takip",
    imageSrc: fallbackImages[5],
    homepagePriority: 6,
  },
  {
    slug: "kardiyoloji",
    imageSrc: fallbackImages[0],
    homepagePriority: 1,
  },
  {
    slug: "dahiliye",
    imageSrc: fallbackImages[1],
    homepagePriority: 2,
  },
  {
    slug: "cildiye",
    imageSrc: fallbackImages[3],
    homepagePriority: 4,
  },
  {
    slug: "noroloji",
    imageSrc: fallbackImages[4],
    homepagePriority: 5,
  },
  {
    slug: "ortopedi",
    imageSrc: fallbackImages[5],
    homepagePriority: 6,
  },
];

export function getFallbackSpecialtyImage(index: number) {
  return fallbackImages[index % fallbackImages.length];
}
