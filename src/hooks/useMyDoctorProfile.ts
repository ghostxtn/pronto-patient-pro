import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";

type UseMyDoctorProfileOptions = {
  enabled?: boolean;
  retry?: boolean;
};

export function useMyDoctorProfile(options?: UseMyDoctorProfileOptions) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-doctor-profile", user?.id],
    queryFn: () => api.doctors.me(),
    enabled: (options?.enabled ?? true) && !!user,
    retry: options?.retry ?? false,
  });
}
