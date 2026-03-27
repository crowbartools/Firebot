import { useFbApi } from "@/hooks/api/use-fb-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteTriggerGroup() {
    const { api } = useFbApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (groupId: string) => api.triggers.deleteGroup(groupId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["triggers"] });
        },
    });
}
