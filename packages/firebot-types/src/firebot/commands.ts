import { ActionTrigger } from "./trigger";

export interface CommandConfigData {
  trigger: string;
  scanWholeMessage?: boolean;
}

export type CommandConfig = ActionTrigger<"command", CommandConfigData>;

export interface CommandConfigsSettings {
  commands: CommandConfig[];
}
