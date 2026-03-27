import { useFbApi } from "@/hooks/api/use-fb-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useReorderTrigger() {
    const { api } = useFbApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            groupId,
            triggerId,
            targetIndex,
        }: {
            groupId?: string;
            triggerId: string;
            targetIndex: number;
        }) => {
            if (groupId) {
                return api.triggers.reorderGroupTrigger(groupId, triggerId, targetIndex);
            }

            return api.triggers.reorderMain(triggerId, targetIndex);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["triggers"] });
        },
    });
}
