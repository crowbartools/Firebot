import { useFbApi } from "@/hooks/api/use-fb-api";
import { useQuery } from "@tanstack/react-query"

export const useStreamingPlatforms = () => {
    const { api } = useFbApi();
    return useQuery({
        queryKey: ["streaming-platforms"],
        queryFn: () => api.streamingPlatform.getStreamingPlatforms(),
        placeholderData: [],
    });
}