import { useFbApi } from "@/hooks/api/use-fb-api";
import { useQuery } from "@tanstack/react-query"

export const useLogins = () => {
    const { api } = useFbApi();
    return useQuery({
        queryKey: ["logins"],
        queryFn: () => api.login.getAllPlatformLogins(),
    });
}