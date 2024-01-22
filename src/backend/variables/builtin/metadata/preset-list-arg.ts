import { ReplaceVariable } from "../../../../types/variables";
import { EffectTrigger } from "../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.QUICK_ACTION] = true;
triggers[EffectTrigger.PRESET_LIST] = true;
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "presetListArg",
        usage: "presetListArg[name]",
        description: "Represents the given argument passed to this preset effect list.",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER, OutputDataType.TEXT]
    },
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    evaluator: (trigger, argName: string = "") => {
        const args = trigger.metadata.presetListArgs || {};
        return args[argName] || null;
    }
};

export default model;
