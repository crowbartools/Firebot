import {
  ActionTriggerType,
  FirebotParameterCategories,
  FirebotParams,
} from "../firebot";
import { Awaitable } from "../misc";
import type { IconName } from "lucide-react/dynamic";

export type FirebotActionIconName = IconName;

export interface FirebotActionType<
  P extends FirebotParams = Record<string, Record<string, unknown>>,
> {
  id: string;
  name: string;
  description: string;
  icon: FirebotActionIconName;
  category?: string;

  parameters?: FirebotParameterCategories<P>;

  execute(context: ExecuteActionContext): Awaitable<void>;
}

export type ExecuteActionContext = {
  actionTriggerType: ActionTriggerType;
  isManualTest?: boolean;
  parameters: Record<string, unknown>;
};
