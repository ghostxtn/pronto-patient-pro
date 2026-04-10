import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { shapeDoctorDiscovery } from "@/lib/doctor-discovery";
import { shapeSpecialtyDiscovery } from "@/lib/specialty-discovery";

export function usePublicSpecialties() {
  const { lang } = useLanguage();

  const query = useQuery({
    queryKey: ["public-specialties"],
    queryFn: async () => {
      const [specialties, doctors] = await Promise.all([
        api.specializations.publicDiscovery(),
        api.doctors.publicDiscovery(),
      ]);

      return { specialties, doctors };
    },
    staleTime: 60_000,
  });

  const doctors = shapeDoctorDiscovery(query.data?.doctors, lang);
  const specialties = shapeSpecialtyDiscovery(query.data?.specialties, doctors);

  return {
    ...query,
    doctors,
    specialties,
    hasLoadedEmptySpecialties: query.isSuccess && specialties.length === 0,
  };
}
