import ActionWorkflowEditor from "@/components/workflows/ActionWorkflowEditor";
import {
  Navbar,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from "@/components/navbar";
import { Settings, Workflow } from "lucide-react";
import { useState } from "react";
import { CommandConfig, CommandConfigData } from "firebot-types";
import { CommandsSettings } from "./CommandSettings";
import {
  CurrentCommandConfigProvider,
  useCurrentCommandConfig,
} from "../providers/current-command-config-provider";

function AddOrEditCommand() {
  const [currentTab, setCurrentTab] = useState("settings");

  const { commandConfig, setCommandConfig, saveCommand, isSaving, isValid } =
    useCurrentCommandConfig();

  return (
    <div className="h-full flex flex-col">
      <div className="h-13 border-b shrink-0">
        <Navbar className="px-2">
          <NavbarSection>
            <NavbarItem
              onClick={() => setCurrentTab("settings")}
              current={currentTab === "settings"}
            >
              <Settings />
              Settings
            </NavbarItem>
            <NavbarItem
              onClick={() => setCurrentTab("workflow")}
              current={currentTab === "workflow"}
            >
              <Workflow /> Workflow Editor
            </NavbarItem>
          </NavbarSection>
          <NavbarSpacer />
          <NavbarSection>
            <NavbarItem href="/commands" disabled={isSaving}>
              Cancel
            </NavbarItem>
            <NavbarItem
              onClick={saveCommand}
              className="bg-primary rounded"
              loading={isSaving}
              disabled={isSaving || !isValid}
            >
              Save
            </NavbarItem>
          </NavbarSection>
        </Navbar>
      </div>
      {currentTab === "settings" && (
        <CommandsSettings
          configData={commandConfig.data ?? {}}
          onUpdate={(data) => {
            setCommandConfig({
              ...commandConfig,
              data: data as CommandConfigData,
            });
          }}
        />
      )}
      {currentTab === "workflow" && (
        <div className="grow">
          <ActionWorkflowEditor
            workflow={commandConfig.actionWorkflow}
            triggerType="command"
            onWorkflowChange={(newWorkflow) =>
              setCommandConfig({
                ...commandConfig,
                actionWorkflow: newWorkflow,
              })
            }
          />
        </div>
      )}
    </div>
  );
}

type Props<IsNew extends boolean> = {
  isNew: IsNew;
  config: IsNew extends true ? Omit<CommandConfig, "id"> : CommandConfig;
};
function WrappedAddOrEditCommand<IsNew extends boolean>({
  isNew,
  config,
}: Props<IsNew>) {
  return (
    <CurrentCommandConfigProvider isNew={isNew} commandConfig={config}>
      <AddOrEditCommand />
    </CurrentCommandConfigProvider>
  );
}

export default WrappedAddOrEditCommand;
