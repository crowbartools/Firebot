import { useQuery } from "@tanstack/react-query";
import { useFbApi } from "../use-fb-api";

export function useActionTypes() {
  const { api } = useFbApi();
  return useQuery({
    queryKey: ["actionTypes"],
    queryFn: () => api.workflows.getActionTypes(),
  });
}
