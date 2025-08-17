import { useQuery } from "@tanstack/react-query";
import { useFbApi } from "../use-fb-api";

export function useCommands() {
  const { api } = useFbApi();
  return useQuery({
    queryKey: ["commands"],
    queryFn: () => api.commands.getAll(),
  });
}
