import { useCreateCommand } from "@/hooks/api/commands/useCreateCommand";
import { useUpdateCommand } from "@/hooks/api/commands/useUpdateCommand";
import { CommandConfig } from "firebot-types";
import { useNavigationGuard } from "next-navigation-guard";
import { useRouter } from "next/router";
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type CurrentCommandConfigContextProps = {
  commandConfig: Omit<CommandConfig, "id">;
  isNew: boolean;
  saveCommand: () => void;
  isSaving: boolean;
  isDirty: boolean;
  isValid: boolean;
  setCommandConfig: (config: Omit<CommandConfig, "id">) => void;
};

const CurrentCommandConfigContext =
  createContext<CurrentCommandConfigContextProps | null>(null);

export function useCurrentCommandConfig() {
  const context = useContext(CurrentCommandConfigContext);
  if (!context) {
    throw new Error(
      "useCurrentCommandConfig must be used within a CurrentCommandConfigProvider."
    );
  }

  return context;
}

export function CurrentCommandConfigProvider({
  isNew,
  commandConfig,
  children,
}: PropsWithChildren<{
  isNew: boolean;
  commandConfig: Omit<CommandConfig, "id">;
}>) {
  const router = useRouter();

  const [config, setCommandConfig] =
    useState<Omit<CommandConfig, "id">>(commandConfig);

  const { mutate: createCommand, isPending: isCreating } = useCreateCommand();
  const { mutate: updateCommand, isPending: isUpdating } = useUpdateCommand();

  // Helper to toggle the sidebar.
  const saveCommand = useCallback(() => {
    console.log("Save Command Config", config);
    // Here you would typically call an API to save the command
    if (isNew) {
      createCommand(config, {
        onSuccess: () => {
          router.push("/commands");
        },
      });
    } else {
      updateCommand(
        { id: (config as CommandConfig).id, commandUpdate: config },
        {
          onSuccess: () => {
            router.push("/commands");
          },
        }
      );
    }
  }, [config, isNew, createCommand, updateCommand, router]);

  const isValid = useMemo(() => {
    return !!config.data?.trigger?.length;
  }, [config.data?.trigger]);

  const contextValue = useMemo<CurrentCommandConfigContextProps>(
    () => ({
      commandConfig: config,
      isNew,
      saveCommand,
      isSaving: isCreating || isUpdating,
      isDirty: JSON.stringify(config) !== JSON.stringify(commandConfig),
      isValid,
      setCommandConfig,
    }),
    [config, isNew, isCreating, isUpdating, commandConfig, saveCommand, isValid]
  );

  useNavigationGuard({
    enabled: contextValue.isDirty && !contextValue.isSaving,
    confirm: () =>
      window.confirm("You have unsaved changes. Do you want to leave?"),
  });

  return (
    <CurrentCommandConfigContext.Provider value={contextValue}>
      {children}
    </CurrentCommandConfigContext.Provider>
  );
}
