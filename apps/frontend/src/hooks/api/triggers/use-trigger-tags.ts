import { useFbApi } from "@/hooks/api/use-fb-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useTriggerTags() {
    const { api } = useFbApi();

    return useQuery({
        queryKey: ["trigger-tags"],
        queryFn: () => api.triggers.getTags(),
    });
}

export function useCreateTriggerTag() {
    const { api } = useFbApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (tag: string) => api.triggers.createTag(tag),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trigger-tags"] });
            queryClient.invalidateQueries({ queryKey: ["triggers"] });
        },
    });
}

export function useDeleteTriggerTag() {
    const { api } = useFbApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (tag: string) => api.triggers.deleteTag(tag),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["trigger-tags"] });
            queryClient.invalidateQueries({ queryKey: ["triggers"] });
        },
    });
}
