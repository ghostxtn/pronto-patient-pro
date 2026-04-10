import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { getDoctorSpecialtyFilters, shapeDoctorDiscovery } from "@/lib/doctor-discovery";
import { useLanguage } from "@/contexts/LanguageContext";

export function usePublicDoctors() {
  const { lang } = useLanguage();

  const query = useQuery({
    queryKey: ["public-doctors"],
    queryFn: async () => api.doctors.publicDiscovery(),
    staleTime: 60_000,
  });

  const doctors = shapeDoctorDiscovery(query.data, lang);
  const specialties = getDoctorSpecialtyFilters(doctors);

  return {
    ...query,
    doctors,
    specialties,
    hasLoadedEmptyDoctors: query.isSuccess && doctors.length === 0,
  };
}
