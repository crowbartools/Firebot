import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { UserCommand } from "../../../../types/commands";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { EffectTrigger } from "../../../../shared/effect-constants";

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "rawArgArray",
        description: "(Deprecated: use $argArray) Returns the raw array of command arguments",
        triggers: triggers,
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ARRAY],
        hidden: true
    },
    evaluator: (trigger: Trigger) : string[] => {
        return trigger.metadata.userCommand?.args
            ?? (trigger.metadata.eventData?.userCommand as UserCommand)?.args
            ?? [];
    }
};

export default model;