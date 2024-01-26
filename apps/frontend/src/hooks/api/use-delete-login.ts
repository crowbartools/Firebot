import { useFbApi } from "@/hooks/api/use-fb-api";
import { useMutation, useQueryClient } from "@tanstack/react-query"

export const useDeleteLogin = () => {
    const { api } = useFbApi();
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({
        platformId,
        loginConfigId,
      }: {
        platformId: string;
        loginConfigId: string;
      }) => api.login.deleteLoginForPlatform(platformId, loginConfigId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["logins"] });
      },
    });
}