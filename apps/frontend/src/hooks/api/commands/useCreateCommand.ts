import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CommandConfig } from "firebot-types";
import { useFbApi } from "../use-fb-api";

export function useCreateCommand() {
  const { api } = useFbApi();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: Omit<CommandConfig, "id">) =>
      api.commands.create(command),
    onSuccess: (createCommand) => {
      queryClient.setQueryData(
        ["commands"],
        (oldCommands: CommandConfig[] | undefined) => {
          if (!oldCommands) return [createCommand];
          return [...oldCommands, createCommand];
        }
      );
    },
  });
}
