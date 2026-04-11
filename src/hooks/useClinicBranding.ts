import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";

type ClinicBranding = {
  name?: string | null;
  logo_url?: string | null;
  updated_at?: string | null;
};

export function useClinicBranding() {
  const { user } = useAuth();

  const { data: clinic } = useQuery<ClinicBranding>({
    queryKey: ["clinic-branding", user?.clinic_id],
    queryFn: () => api.clinics.get(user!.clinic_id!),
    enabled: Boolean(user?.clinic_id),
    staleTime: 1000 * 60 * 5,
  });

  const logoUrl = clinic?.logo_url
    ? `${clinic.logo_url.trim()}?t=${new Date(clinic.updated_at ?? Date.now()).getTime()}`
    : null;

  return {
    logoUrl,
    clinicName: clinic?.name?.trim() || "MediBook",
    clinic,
  };
}
