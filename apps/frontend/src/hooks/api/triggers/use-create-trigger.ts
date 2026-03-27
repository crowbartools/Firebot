import { useFbApi } from "@/hooks/api/use-fb-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TriggerConfig } from "firebot-types";

export function useCreateTrigger() {
    const { api } = useFbApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            groupId,
            trigger,
        }: {
            groupId?: string;
            trigger: Omit<TriggerConfig, "id">;
        }) => {
            if (groupId) {
                return api.triggers.createGroupTrigger(groupId, trigger);
            }
            return api.triggers.createMain(trigger);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["triggers"] });
        },
    });
}
