import type { ReplaceVariable } from "../../types/variables";

type VariableConfig = {
    handle: string;
    description: string;
    events: string[];
    eventMetaKey: string;
    usage?: string;
    defaultValue?: unknown;
    type: ReplaceVariable["definition"]["possibleDataOutput"][number] | ReplaceVariable["definition"]["possibleDataOutput"];
};

export function createEventDataVariable({
    events,
    eventMetaKey,
    type,
    defaultValue,
    ...definition
}: VariableConfig): ReplaceVariable {
    return {
        definition: {
            ...definition,
            possibleDataOutput: Array.isArray(type) ? type : [type],
            triggers: {
                ["event"]: events,
                ["manual"]: true
            }
        },
        evaluator(trigger) {
            const typeDefault = type === "number" ? 0 : "";
            return (
                trigger?.metadata?.eventData[eventMetaKey] ??
        defaultValue ??
        typeDefault
            );
        }
    };
}