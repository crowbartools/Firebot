import { useFbApi } from "@/hooks/api/use-fb-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useDeleteTrigger() {
    const { api } = useFbApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            groupId,
            triggerId,
        }: {
            groupId?: string;
            triggerId: string;
        }) => {
            if (groupId) {
                return api.triggers.deleteGroupTrigger(groupId, triggerId);
            }
            return api.triggers.deleteMain(triggerId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["triggers"] });
        },
    });
}
