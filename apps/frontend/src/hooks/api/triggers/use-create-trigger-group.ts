import { useFbApi } from "@/hooks/api/use-fb-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateTriggerGroup() {
    const { api } = useFbApi();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (name: string) => api.triggers.createGroup(name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["triggers"] });
        },
    });
}
