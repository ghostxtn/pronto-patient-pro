import {
  DOCTOR_FALLBACK_IMAGE,
  doctorPresentation,
  type DoctorPresentation,
} from "@/data/doctorPresentation";
import {
  specialtyPresentation,
  type SpecialtyPresentation,
} from "@/data/specialtyPresentation";
import {
  getLocalizedSpecialtyCopy,
  toHomepageSlug,
} from "@/lib/specialty-localization";
import type { Language } from "@/i18n/config";

export type HomepagePreviewDoctorRecord = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  title?: string | null;
  bio?: string | null;
  specialization?: {
    id?: string | null;
    name?: string | null;
  } | null;
};

export type HomepagePreviewSpecialtyRecord = {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
};

export type HomepagePreviewResponse = {
  clinic?: {
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    logo_url?: string | null;
    default_appointment_duration?: number | null;
    appointment_approval_mode?: "auto" | "manual" | null;
    max_booking_days_ahead?: number | null;
    cancellation_hours_before?: number | null;
  } | null;
  doctors: HomepagePreviewDoctorRecord[];
  specialties: HomepagePreviewSpecialtyRecord[];
};

export type HomepageDoctorPreviewItem = {
  id: string;
  slug: string;
  name: string;
  title: string;
  specialtyName: string;
  imageSrc: string;
  previewText: string;
  shortBio?: string;
  focusTags: string[];
};

export type HomepageSpecialtyPreviewItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageSrc: string | null;
  previewText?: string;
};

const MAX_DOCTOR_PREVIEW = 50;
const MAX_SPECIALTY_PREVIEW = 50;
const SPECIALTY_FALLBACK_IMAGE = null;

function sortByPriority<T extends { homepagePriority?: number } & Record<string, unknown>>(
  items: T[],
  getLabel: (item: T) => string,
) {
  return [...items].sort((left, right) => {
    const priorityDiff = (left.homepagePriority ?? 999) - (right.homepagePriority ?? 999);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return getLabel(left).localeCompare(getLabel(right), "tr");
  });
}

function matchDoctorPresentation(
  doctor: HomepagePreviewDoctorRecord,
  slug: string,
): DoctorPresentation | undefined {
  return (
    doctorPresentation.find((entry) => entry.doctorId === doctor.id) ??
    doctorPresentation.find((entry) => entry.slug === slug)
  );
}

function matchSpecialtyPresentation(slug: string): SpecialtyPresentation | undefined {
  return specialtyPresentation.find((entry) => entry.slug === slug);
}

function getDoctorPreviewText(
  doctor: HomepagePreviewDoctorRecord,
  presentation: DoctorPresentation | undefined,
  lang: Language,
) {
  if (presentation?.previewText) {
    return presentation.previewText;
  }

  if (doctor.bio?.trim()) {
    return doctor.bio.trim();
  }

  const specialtySlug = toHomepageSlug(doctor.specialization?.name?.trim() || "");
  const specialtyName =
    getLocalizedSpecialtyCopy(doctor.specialization?.name, specialtySlug, lang).name ||
    doctor.specialization?.name?.trim();

  if (lang === "tr") {
    return specialtyName
      ? `${specialtyName} odaginda duzenli degerlendirme ve koordinasyon yaklasimiyla calisir.`
      : "Koordinasyon destekli klinik bakim surecinde calisir.";
  }

  return specialtyName
    ? `Works with a coordinated clinical approach focused on ${specialtyName.toLowerCase()}.`
    : "Works with a coordination-led clinical care approach.";
}

function getDoctorFocusTags(
  doctor: HomepagePreviewDoctorRecord,
  presentation: DoctorPresentation | undefined,
  lang: Language,
) {
  if (presentation?.focusTags?.length) {
    return presentation.focusTags;
  }

  const specialtySlug = toHomepageSlug(doctor.specialization?.name?.trim() || "");
  const specialtyName =
    getLocalizedSpecialtyCopy(doctor.specialization?.name, specialtySlug, lang).name ||
    doctor.specialization?.name?.trim();

  if (!specialtyName) {
    return lang === "tr" ? ["Klinik Surec"] : ["Clinic Flow"];
  }

  return [specialtyName];
}

function mapDoctorPreviewItem(
  doctor: HomepagePreviewDoctorRecord,
  lang: Language,
): HomepageDoctorPreviewItem {
  const name = [doctor.firstName, doctor.lastName].filter(Boolean).join(" ").trim() || "Doktor";
  const slug = toHomepageSlug(name);
  const presentation = matchDoctorPresentation(doctor, slug);
  const specialtySlug = toHomepageSlug(doctor.specialization?.name?.trim() || "");
  const localizedSpecialty = getLocalizedSpecialtyCopy(doctor.specialization?.name, specialtySlug, lang);

  return {
    id: doctor.id,
    slug,
    name,
    title: doctor.title?.trim() || (lang === "tr" ? "Uzman Hekim" : "Specialist Physician"),
    specialtyName:
      localizedSpecialty.name || (lang === "tr" ? "Genel Konsultasyon" : "General Consultation"),
    imageSrc: doctor.avatarUrl?.trim() || presentation?.imageSrc || DOCTOR_FALLBACK_IMAGE,
    previewText: getDoctorPreviewText(doctor, presentation, lang),
    shortBio: presentation?.shortBio,
    focusTags: getDoctorFocusTags(doctor, presentation, lang),
  };
}

function mapSpecialtyPreviewItem(
  specialty: HomepagePreviewSpecialtyRecord,
  lang: Language,
): HomepageSpecialtyPreviewItem & { homepagePriority?: number } {
  const slug = toHomepageSlug(specialty.name);
  const presentation = matchSpecialtyPresentation(slug);
  const localizedSpecialty = getLocalizedSpecialtyCopy(specialty.name, slug, lang);

  return {
    id: specialty.id,
    slug,
    name: localizedSpecialty.name || specialty.name,
    description:
      localizedSpecialty.description ||
      specialty.description?.trim() ||
      (lang === "tr"
        ? "Klinik ekip degerlendirmesiyle desteklenen uzmanlik alani."
        : "A specialty area supported by coordinated clinic review."),
    imageSrc: specialty.imageUrl?.trim() ? specialty.imageUrl.trim() : SPECIALTY_FALLBACK_IMAGE,
    previewText: presentation?.previewText,
    homepagePriority: presentation?.homepagePriority,
  };
}

export function shapeHomepagePreview(
  data: HomepagePreviewResponse | undefined,
  lang: Language,
) {
  const doctorItems = (data?.doctors ?? []).map((doctor) => {
    const item = mapDoctorPreviewItem(doctor, lang);
    const presentation = doctorPresentation.find(
      (entry) => entry.doctorId === doctor.id || entry.slug === item.slug,
    );
    return {
      ...item,
      homepagePriority: presentation?.homepagePriority,
    };
  });

  const specialtyItems = (data?.specialties ?? []).map((specialty) =>
    mapSpecialtyPreviewItem(specialty, lang),
  );

  return {
    doctors: sortByPriority(doctorItems, (item) => item.name)
      .slice(0, MAX_DOCTOR_PREVIEW)
      .map(({ homepagePriority: _homepagePriority, ...item }) => item),
    specialties: sortByPriority(specialtyItems, (item) => item.name)
      .slice(0, MAX_SPECIALTY_PREVIEW)
      .map(({ homepagePriority: _homepagePriority, ...item }) => item),
  };
}
