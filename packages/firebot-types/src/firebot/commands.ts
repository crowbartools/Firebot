import { Trigger } from "./trigger";

export interface CommandConfigMetadata {
  trigger: string;
  scanWholeMessage?: boolean;
}

export interface CommandConfig
  extends Trigger<"command", CommandConfigMetadata> {}

export interface CommandConfigsSettings {
  commands: CommandConfigMetadata[];
}
