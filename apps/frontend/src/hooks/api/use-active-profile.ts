import { useFbApi } from "@/hooks/api/use-fb-api";
import { useQuery } from "@tanstack/react-query"

export const useActiveProfile = () => {
    const { api } = useFbApi();
    return useQuery({
        queryKey: ["active-profile"],
        queryFn: () => api.profile.getActiveProfile(),
    });
}