import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const { EffectTrigger } = require("../../../../shared/effect-constants");

const triggers = {};
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.PRESET_LIST] = true;
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "count",
        usage: "count",
        description: "Displays the number of times the given command has been run.",
        triggers: triggers,
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger: Trigger) => {
        const count = trigger.metadata.command && (<Record<string, unknown>>trigger.metadata.command).count;
        return count || 0;
    }
};

export default model;
