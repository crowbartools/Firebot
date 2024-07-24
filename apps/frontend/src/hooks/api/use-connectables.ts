import { useFbApi } from "@/hooks/api/use-fb-api";
import { useQuery } from "@tanstack/react-query";

export const useConnectables = () => {
  const { api } = useFbApi();
  return useQuery({
    queryKey: ["connectables"],
    queryFn: () => api.connection.getConnectables(),
  });
};
