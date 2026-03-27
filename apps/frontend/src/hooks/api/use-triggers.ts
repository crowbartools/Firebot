import { useFbApi } from "@/hooks/api/use-fb-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRealTimeEvent } from "./use-realtime-event";

export function useTriggers() {
    const { api } = useFbApi();
    const queryClient = useQueryClient();

    useRealTimeEvent("triggers:update", () => {
        queryClient.invalidateQueries({ queryKey: ["triggers"] });
    });

    return useQuery({
        queryKey: ["triggers"],
        queryFn: () => api.triggers.getAll(),
    });
}