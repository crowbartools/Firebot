import { FirebotActionWorkflow } from "../actions";

export type ActionTriggerType = "command" | "event-trigger";

export interface ActionTrigger<
  T extends ActionTriggerType,
  Data extends object,
> {
  type: T;
  id: string;
  name?: string;
  description?: string;
  data?: Data;
  actionWorkflow: FirebotActionWorkflow;
}
