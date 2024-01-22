import { ReplaceVariable } from "../../../../types/variables";
import { EffectTrigger } from "../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "commandTrigger",
        description: "The trigger of the issued command.",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.userCommand.trigger;
    }
};

export default model;
