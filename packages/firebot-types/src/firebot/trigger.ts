import { ActionFlow } from "./actions";

export type TriggerType = "command";

export interface Trigger<T extends TriggerType, Metadata extends object> {
  type: T;
  id: string;
  name?: string;
  description?: string;
  metadata: Metadata;
  actionFlow: ActionFlow;
}
