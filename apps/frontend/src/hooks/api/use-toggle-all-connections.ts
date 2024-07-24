import { useFbApi } from "@/hooks/api/use-fb-api";
import { useMutation } from "@tanstack/react-query";

export const useToggleAllConnections = () => {
  const { api } = useFbApi();
  return useMutation({
    mutationFn: (shouldConnect: boolean) =>
      api.connection.useToggleAllConnections(shouldConnect),
  });
};
