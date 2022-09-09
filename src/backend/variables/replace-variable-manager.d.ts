import { ReplaceVariable } from "@crowbartools/firebot-custom-scripts-types/types/modules/replace-variable-manager";

declare class ReplaceVariableManager {
  registerReplaceVariable(replaceVariable: ReplaceVariable): void;
}

declare const _ReplaceVariableManager: ReplaceVariableManager;
export default _ReplaceVariableManager;
