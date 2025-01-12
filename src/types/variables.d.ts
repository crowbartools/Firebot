export { Trigger, TriggersObject } from "./triggers";

export type VariableCategory =
    | "common"
    | "trigger based"
    | "user based"
    | "text"
    | "numbers"
    | "advanced"
    | "obs"
    | "integrations";

interface VariableDefinition {
    handle: string;
    aliases?: string[];
    usage?: string;
    description: string;
    examples?: Array<{
        usage: string;
        description: string;
    }>;
    categories?: VariableCategory[];
    triggers?: TriggersObject;
    possibleDataOutput: Array<"null" | "bool" | "number" | "text" | "array" | "object" | "ALL">;
    hidden?: boolean;
}

type Variable = {
    definition: VariableDefinition;
    argsCheck?: (...args: unknown[]) => void;
    evaluator(trigger: Trigger, ...args: unknown[]): PromiseLike<unknown> | unknown;
}

type SpoofedVariable = {
    definition: VariableDefinition & { spoof: true };
    argsCheck?: never;
    evaluator?: never;

}

export type ReplaceVariable = Variable | SpoofedVariable;