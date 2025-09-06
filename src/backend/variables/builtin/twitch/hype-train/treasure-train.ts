import { ReplaceVariable } from "../../../../../types/variables";
import { EffectTrigger } from "../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = [
    "twitch:hype-train-end",
    "twitch:hype-train-progress",
    "twitch:hype-train-start"
];
triggers[EffectTrigger.MANUAL] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "isTreasureTrain",
        description: "`true` when the hype train is a Treasure Train, `false` otherwise.",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.BOOLEAN]
    },
    evaluator: (trigger) => {
        return trigger.metadata?.eventData?.isTreasureTrain ?? false;
    }
};

export default model;
