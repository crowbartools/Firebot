import { useFbApi } from "@/hooks/api/use-fb-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRealTimeEvent } from "./use-realtime-event";

export function useEvents() {
    const { api } = useFbApi();
    const queryClient = useQueryClient();

    useRealTimeEvent("events:update", () => {
        queryClient.invalidateQueries({ queryKey: ["events"] });
    });

    return useQuery({
        queryKey: ["events"],
        queryFn: () => api.events.getAll(),
    });
}
