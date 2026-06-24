import type { ReplaceVariable, VariableConfig } from "../../types/variables";

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