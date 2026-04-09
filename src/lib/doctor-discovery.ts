import {
  DOCTOR_FALLBACK_IMAGE,
  doctorPresentation,
  type DoctorPresentation,
} from "@/data/doctorPresentation";
import {
  getLocalizedSpecialtyCopy,
  toHomepageSlug,
} from "@/lib/specialty-localization";
import type { Language } from "@/i18n/config";

export type PublicDoctorRecord = {
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

export type DoctorDiscoveryItem = {
  id: string;
  slug: string;
  fullName: string;
  title: string;
  specialtyId?: string;
  specialtyName: string;
  imageSrc: string;
  previewText: string;
  biography?: string;
  focusTags: string[];
};

function matchPresentation(record: PublicDoctorRecord, slug: string): DoctorPresentation | undefined {
  return (
    doctorPresentation.find((entry) => entry.doctorId === record.id) ??
    doctorPresentation.find((entry) => entry.slug === slug)
  );
}

function sortDoctors(
  left: DoctorDiscoveryItem & { listingPriority?: number },
  right: DoctorDiscoveryItem & { listingPriority?: number },
) {
  const priorityDiff = (left.listingPriority ?? 999) - (right.listingPriority ?? 999);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  return left.fullName.localeCompare(right.fullName, "tr");
}

export function shapeDoctorDiscovery(
  records: PublicDoctorRecord[] | undefined,
  lang: Language,
) {
  return (records ?? [])
    .map((record) => {
      const fullName =
        [record.firstName, record.lastName].filter(Boolean).join(" ").trim() ||
        (lang === "tr" ? "Doktor" : "Doctor");
      const slug = toHomepageSlug(fullName);
      const presentation = matchPresentation(record, slug);
      const rawSpecialtyName = record.specialization?.name?.trim() || "";
      const specialtySlug = toHomepageSlug(rawSpecialtyName);
      const localizedSpecialty = getLocalizedSpecialtyCopy(rawSpecialtyName, specialtySlug, lang);
      const specialtyName =
        localizedSpecialty.name || (lang === "tr" ? "Genel Konsultasyon" : "General Consultation");

      const item: DoctorDiscoveryItem & { listingPriority?: number } = {
        id: record.id,
        slug,
        fullName,
        title: record.title?.trim() || (lang === "tr" ? "Uzman Hekim" : "Specialist Physician"),
        specialtyId: record.specialization?.id ?? undefined,
        specialtyName,
        imageSrc: record.avatarUrl?.trim() || presentation?.imageSrc || DOCTOR_FALLBACK_IMAGE,
        previewText:
          presentation?.previewText ||
          record.bio?.trim() ||
          (lang === "tr"
            ? "Klinik koordinasyon ve dogru yonlendirme odakli hasta surecinde calisir."
            : "Works with a patient flow focused on clinical coordination and accurate direction."),
        biography: presentation?.shortBio || record.bio?.trim() || undefined,
        focusTags:
          presentation?.focusTags?.length
            ? presentation.focusTags
            : specialtyName
              ? [specialtyName]
              : [lang === "tr" ? "Klinik Surec" : "Clinic Flow"],
        listingPriority: presentation?.listingPriority,
      };

      return item;
    })
    .sort(sortDoctors)
    .map(({ listingPriority: _listingPriority, ...item }) => item);
}

export function getDoctorSpecialtyFilters(doctors: DoctorDiscoveryItem[]) {
  const seen = new Map<string, { id?: string; key: string; slug: string; name: string }>();

  doctors.forEach((doctor) => {
    const filterKey = doctor.specialtyId || doctor.specialtyName;
    if (!seen.has(filterKey)) {
      seen.set(filterKey, {
        id: doctor.specialtyId,
        key: filterKey,
        slug: toHomepageSlug(doctor.specialtyName),
        name: doctor.specialtyName,
      });
    }
  });

  return Array.from(seen.values()).sort((left, right) => left.name.localeCompare(right.name, "tr"));
}
