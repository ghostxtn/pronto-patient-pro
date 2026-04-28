import doctorPlaceholder from "@/assets/doctors/placeholder.svg";

export type DoctorPresentation = {
  doctorId?: string;
  slug?: string;
  imageSrc: string;
  previewText?: string;
  previewTextTr?: string;
  shortBio?: string;
  focusTags?: string[];
  focusTagsTr?: string[];
  homepagePriority?: number;
  listingPriority?: number;
};

export const DOCTOR_FALLBACK_IMAGE = doctorPlaceholder;

export const doctorPresentation: DoctorPresentation[] = [
  {
    slug: "deniz-yilmaz",
    imageSrc: DOCTOR_FALLBACK_IMAGE,
    previewText: "Works with a coordination-led clinical flow focused on assessment and follow-up.",
    previewTextTr: "Koordinasyon destekli klinik akışta değerlendirme ve takip odaklı çalışır.",
    focusTags: ["Coordination", "Follow-up"],
    focusTagsTr: ["Koordinasyon", "Takip"],
    homepagePriority: 1,
    listingPriority: 1,
  },
  {
    slug: "mert-kaya",
    imageSrc: DOCTOR_FALLBACK_IMAGE,
    previewText: "Works with an initial assessment and structured clinical direction approach.",
    previewTextTr: "İlk değerlendirme ve düzenli klinik yönlendirme yaklaşımıyla çalışır.",
    focusTags: ["General Assessment", "Clinical Flow"],
    focusTagsTr: ["Genel Değerlendirme", "Klinik Akış"],
    homepagePriority: 2,
    listingPriority: 2,
  },
];
