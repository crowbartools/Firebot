import type { Trigger, TriggersObject, TriggerType, TriggerMeta } from "./triggers";
import type { Awaitable } from "./util-types";

export { Trigger, TriggersObject, TriggerType, TriggerMeta };

export type VariableCategory =
    | "common"
    | "trigger based"
    | "user based"
    | "text"
    | "numbers"
    | "advanced"
    | "obs"
    | "integrations";

export type VariableUsage = {
    usage: string;
    description?: string;
};

interface VariableDefinition {
    handle: string;
    aliases?: string[];
    usage?: string;
    description: string;
    examples?: VariableUsage[];
    hasSuggestions?: boolean;
    noSuggestionsText?: string;
    categories?: VariableCategory[];
    triggers?: TriggersObject;
    possibleDataOutput: Array<"null" | "bool" | "number" | "text" | "array" | "object" | "ALL">;
    sensitive?: boolean;
    hidden?: boolean;
}

type Variable = {
    definition: VariableDefinition;
    getSuggestions?: (triggerType: TriggerType, triggerMeta?: TriggerMeta) => Awaitable<VariableUsage[]>;
    argsCheck?: (...args: unknown[]) => void;
    evaluator(trigger: Trigger, ...args: unknown[]): Awaitable<unknown>;
};

type SpoofedVariable = {
    definition: VariableDefinition & { spoof: true };
    argsCheck?: never;
    evaluator?: never;
    getSuggestions?: (triggerType: TriggerType, triggerMeta?: TriggerMeta) => Awaitable<VariableUsage[]>;
};

export type ReplaceVariable = Variable | SpoofedVariable;

export type RegisteredVariable = {
    definition: VariableDefinition;
    handle: string;
    triggers: TriggersObject;
    argsCheck: (...args: unknown[]) => void;
    evaluator(trigger: Trigger, ...args: unknown[]): Awaitable<unknown>;
    getSuggestions: (triggerType: TriggerType, triggerMeta?: TriggerMeta) => Awaitable<VariableUsage[]>;
};