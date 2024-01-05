import { Trigger, TriggersObject } from "./triggers";

export type VariableCategory =
    | "common"
    | "trigger based"
    | "user based"
    | "text"
    | "numbers"
    | "advanced";

export type ReplaceVariable = {
    definition: {
        handle: string;
        usage?: string;
        description: string;
        examples?: Array<{
            usage: string;
            description: string;
        }>;
        categories?: VariableCategory[];
        triggers?: TriggersObject;
        possibleDataOutput: Array<"text" | "number">;
    };
    evaluator(trigger: Trigger, ...args: unknown[]): PromiseLike<unknown> | unknown;
};