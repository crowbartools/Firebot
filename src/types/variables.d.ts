export { Trigger, TriggersObject } from "./triggers";

export type VariableCategory =
    | "common"
    | "trigger based"
    | "user based"
    | "text"
    | "numbers"
    | "advanced";

interface VariableDefinition {
    handle: string;
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

interface Variable {
    definition: VariableDefinition;
    evaluator(trigger: Trigger, ...args: unknown[]): PromiseLike<unknown> | unknown;
}

interface SpoofedVariableDefinition extends VariableDefinition {
    spoof: true
}
interface SpoofedCariable extends Omit<Variable, "evaluator"> {
    definition: SpoofedVariableDefinition;
}

export type ReplaceVariable = Variable | SpoofedVariable;