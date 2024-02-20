import { useFbApi } from "@/hooks/api/use-fb-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRealTimeEvent } from "./use-realtime-event";

export const useLogins = () => {
  const { api } = useFbApi();

  const queryClient = useQueryClient();

  // TODO: find a better place to put this
  useRealTimeEvent("login-update", () => {
    queryClient.invalidateQueries({ queryKey: ["logins"] });
  });

  return useQuery({
    queryKey: ["logins"],
    queryFn: () => api.login.getAllPlatformLogins(),
  });
};