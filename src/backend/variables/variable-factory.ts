import { ReplaceVariable } from "../../types/variables";
import { EffectTrigger } from "../../shared/effect-constants";

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
                [EffectTrigger.EVENT]: events,
                [EffectTrigger.MANUAL]: true
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
