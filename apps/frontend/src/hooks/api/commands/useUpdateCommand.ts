import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CommandConfig } from "firebot-types";
import { useFbApi } from "../use-fb-api";

export function useUpdateCommand() {
  const { api } = useFbApi();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      commandUpdate,
    }: {
      id: string;
      commandUpdate: Partial<Omit<CommandConfig, "id">>;
    }) => api.commands.update(id, commandUpdate),
    onSuccess: (updatedCommand) => {
      queryClient.setQueryData(
        ["commands"],
        (oldCommands: CommandConfig[] | undefined) => {
          if (!oldCommands) return [updatedCommand];
          return oldCommands.map((cmd) =>
            cmd.id === updatedCommand.id ? updatedCommand : cmd
          );
        }
      );

      queryClient.setQueryData(["commands", updatedCommand.id], updatedCommand);
    },
  });
}
