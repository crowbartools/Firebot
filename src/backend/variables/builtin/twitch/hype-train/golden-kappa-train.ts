import { ReplaceVariable } from "../../../../../types/variables";
import { EffectTrigger } from "../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:hype-train-start", "twitch:hype-train-progress", "twitch:hype-train-end"];
triggers[EffectTrigger.MANUAL] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "isGoldenKappaTrain",
        description: "Whether or not a Twitch Hype Train is a Golden Kappa Train.",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.BOOLEAN]
    },
    evaluator: (trigger) => {
        return trigger.metadata?.eventData?.isGoldenKappa ?? false;
    }
};

export default model;
