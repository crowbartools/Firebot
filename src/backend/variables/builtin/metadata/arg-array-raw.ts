import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const { EffectTrigger } = require("../../../../shared/effect-constants");

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "rawArgArray",
        description: "(Deprecated: use $argArray) Returns the raw array of command arguments",
        triggers: triggers,
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.ARRAY]
    },
    evaluator: (trigger: Trigger) : string[] => {
        return trigger.metadata.userCommand ? trigger.metadata.userCommand.args : [];
    }
};

export default model;
