import { Trigger } from "./trigger";

export interface CommandConfigMetadata {
  trigger: string;
  scanWholeMessage?: boolean;
}

export type CommandConfig = Trigger<"command", CommandConfigMetadata>;

export interface CommandConfigsSettings {
  commands: CommandConfig[];
}
