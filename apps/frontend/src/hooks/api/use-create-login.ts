import { useFbApi } from "@/hooks/api/use-fb-api";
import { useMutation, useQueryClient } from "@tanstack/react-query"

export const useCreateLogin = () => {
    const { api } = useFbApi();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ platformId }: { platformId: string }) =>
        api.login.createLoginForPlatform(platformId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["logins"] });
      },
    });
}