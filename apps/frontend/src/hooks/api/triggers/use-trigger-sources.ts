import { useFbApi } from "@/hooks/api/use-fb-api";
import { useQuery } from "@tanstack/react-query";

export function useTriggerSources() {
    const { api } = useFbApi();

    return useQuery({
        queryKey: ["trigger-sources"],
        queryFn: () => api.triggers.getSources(),
    });
}
