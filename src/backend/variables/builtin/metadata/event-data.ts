import { ReplaceVariable } from "../../../../types/variables";
import { EffectTrigger } from "../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = true;
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "eventData",
        description: "An object containing all the metadata included with the event.",
        triggers: triggers,
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.OBJECT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData;
    }
};

export default model;