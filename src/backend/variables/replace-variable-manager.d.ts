import { Trigger } from "../../../../../types/triggers";
import { ReplaceVariable } from "../../../../../types/variables";

declare class ReplaceVariableManager {
    registerReplaceVariable(replaceVariable: ReplaceVariable): void;
    evaluateText(input: string, metadata: unknown, trigger: Trigger, onlyValidate?: boolean) : string
}

declare const _ReplaceVariableManager: ReplaceVariableManager;
export default _ReplaceVariableManager;
