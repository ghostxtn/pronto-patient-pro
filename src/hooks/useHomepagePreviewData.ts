import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import type { SupportedLanguage } from "@/components/landing/content";
import { shapeHomepagePreview } from "@/lib/homepage-preview";

export function useHomepagePreviewData(lang: SupportedLanguage) {
  const query = useQuery({
    queryKey: ["homepage-preview"],
    queryFn: async () => api.homepagePreview.get(),
    staleTime: 60_000,
  });

  const shaped = shapeHomepagePreview(query.data, lang);

  return {
    ...query,
    doctors: shaped.doctors,
    specialties: shaped.specialties,
    hasLoadedEmptyDoctors: query.isSuccess && shaped.doctors.length === 0,
    hasLoadedEmptySpecialties: query.isSuccess && shaped.specialties.length === 0,
  };
}
