import { useQuery } from "@tanstack/react-query";
import { useFbApi } from "../use-fb-api";

export function useCommand(commandId: string) {
  const { api } = useFbApi();
  return useQuery({
    queryKey: ["commands", commandId],
    queryFn: () => api.commands.get(commandId),
  });
}
