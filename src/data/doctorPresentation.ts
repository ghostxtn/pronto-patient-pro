import doctorPlaceholder from "@/assets/doctors/placeholder.svg";

export type DoctorPresentation = {
  doctorId?: string;
  slug?: string;
  imageSrc: string;
  previewText?: string;
  shortBio?: string;
  focusTags?: string[];
  homepagePriority?: number;
  listingPriority?: number;
};

export const DOCTOR_FALLBACK_IMAGE = doctorPlaceholder;

export const doctorPresentation: DoctorPresentation[] = [
  {
    slug: "deniz-yilmaz",
    imageSrc: DOCTOR_FALLBACK_IMAGE,
    previewText: "Koordinasyon destekli klinik akista degerlendirme ve takip odakli calisir.",
    focusTags: ["Koordinasyon", "Takip"],
    homepagePriority: 1,
    listingPriority: 1,
  },
  {
    slug: "mert-kaya",
    imageSrc: DOCTOR_FALLBACK_IMAGE,
    previewText: "Ilk degerlendirme ve duzenli klinik yonlendirme yaklasimiyla calisir.",
    focusTags: ["Genel Degerlendirme", "Klinik Akis"],
    homepagePriority: 2,
    listingPriority: 2,
  },
];
