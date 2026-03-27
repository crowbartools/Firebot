import { useFbApi } from "@/hooks/api/use-fb-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TriggerGroup } from "firebot-types";

export function useUpdateTriggerGroup() {
    const { api } = useFbApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            groupId,
            groupUpdate,
        }: {
            groupId: string;
            groupUpdate: Partial<Pick<TriggerGroup, "name" | "active">>;
        }) => api.triggers.updateGroup(groupId, groupUpdate),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["triggers"] });
        },
    });
}
