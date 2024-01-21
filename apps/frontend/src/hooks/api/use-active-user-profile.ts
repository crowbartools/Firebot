import { useFbApi } from "@/hooks/api/use-fb-api";
import { useQuery } from "@tanstack/react-query"

export const useActiveUserProfile = () => {
    const { api } = useFbApi();
    return useQuery({
        queryKey: ["active-user-profile"],
        queryFn: () => api.userProfile.getActiveUserProfile(),
    });
}