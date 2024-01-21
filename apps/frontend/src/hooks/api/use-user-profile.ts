import { useFbApi } from "@/hooks/api/use-fb-api";
import { useQuery } from "@tanstack/react-query"

export const useUserProfiles = () => {
    const { api } = useFbApi();
    return useQuery({
        queryKey: ["user-profiles"],
        queryFn: () => api.userProfile.getUserProfiles(),
        placeholderData: [],
    });
}