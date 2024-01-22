import { useFbApi } from "@/hooks/api/use-fb-api";
import { useQuery } from "@tanstack/react-query"

export const useProfiles = () => {
    const { api } = useFbApi();
    return useQuery({
        queryKey: ["profiles"],
        queryFn: () => api.profile.getProfiles(),
        placeholderData: [],
    });
}