import { useFbApi } from "@/hooks/api/use-fb-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TriggerConfig } from "firebot-types";

export function useUpdateTrigger() {
    const { api } = useFbApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            groupId,
            triggerId,
            triggerUpdate,
        }: {
            groupId?: string;
            triggerId: string;
            triggerUpdate: Partial<Omit<TriggerConfig, "id">>;
        }) => {
            if (groupId) {
                return api.triggers.updateGroupTrigger(groupId, triggerId, triggerUpdate);
            }
            return api.triggers.updateMain(triggerId, triggerUpdate);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["triggers"] });
        },
    });
}
