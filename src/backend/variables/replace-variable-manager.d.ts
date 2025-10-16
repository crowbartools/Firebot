import { ReplaceVariable, RegisteredVariable } from "../../types/variables";
import { Trigger } from "../../../../../types/triggers";

declare class ReplaceVariableManager {
    registerReplaceVariable(replaceVariable: ReplaceVariable): void;
    evaluateText(input: string, metadata: unknown, trigger: Trigger, onlyValidate?: boolean) : string;
    getReplaceVariables(): RegisteredVariable[];
}

declare const _ReplaceVariableManager: ReplaceVariableManager;
export default _ReplaceVariableManager;
