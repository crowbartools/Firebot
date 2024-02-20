import { useFbApi } from "@/hooks/api/use-fb-api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FirebotAccountType } from "firebot-types";

export const useDeleteAccountForLogin = () => {
  const { api } = useFbApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      platformId,
      loginConfigId,
      accountType,
    }: {
      platformId: string;
      loginConfigId: string;
      accountType: FirebotAccountType;
    }) =>
      api.login.deleteAccountForLoginForPlatform(
        platformId,
        loginConfigId,
        accountType
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logins"] });
    },
  });
};
