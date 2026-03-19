import { specialtyPresentation, getFallbackSpecialtyImage } from "@/data/specialtyPresentation";
import type { DoctorDiscoveryItem } from "@/lib/doctor-discovery";
import { toHomepageSlug } from "@/lib/homepage-preview";

export type PublicSpecialtyRecord = {
  id: string;
  name: string;
  description?: string | null;
};

export type SpecialtyDiscoveryItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageSrc: string;
  previewText?: string;
  doctorCount: number;
  relatedDoctors: Array<{
    id: string;
    slug: string;
    fullName: string;
    title: string;
  }>;
};

export function shapeSpecialtyDiscovery(
  specialties: PublicSpecialtyRecord[] | undefined,
  doctors: DoctorDiscoveryItem[],
) {
  return (specialties ?? [])
    .map((specialty, index) => {
      const slug = toHomepageSlug(specialty.name);
      const presentation = specialtyPresentation.find((entry) => entry.slug === slug);
      const relatedDoctors = doctors
        .filter((doctor) => doctor.specialtyId === specialty.id || doctor.specialtyName === specialty.name)
        .map((doctor) => ({
          id: doctor.id,
          slug: doctor.slug,
          fullName: doctor.fullName,
          title: doctor.title,
        }));

      return {
        id: specialty.id,
        slug,
        name: specialty.name,
        description:
          specialty.description?.trim() ||
          "Koordinasyon destekli klinik degerlendirme ve yonlendirme ile ele alinir.",
        imageSrc: presentation?.imageSrc || getFallbackSpecialtyImage(index),
        previewText: presentation?.previewText,
        doctorCount: relatedDoctors.length,
        relatedDoctors: relatedDoctors.slice(0, 3),
        homepagePriority: presentation?.homepagePriority,
      };
    })
    .sort((left, right) => {
      const priorityDiff = (left.homepagePriority ?? 999) - (right.homepagePriority ?? 999);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return left.name.localeCompare(right.name, "tr");
    })
    .map(({ homepagePriority: _homepagePriority, ...item }) => item);
}
