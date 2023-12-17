import { EffectTrigger } from "../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:hype-train-start","twitch:hype-train-progress","twitch:hype-train-end"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "hypeTrainLevel",
        description: "The level of the current Twitch Hype Train.",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.level;
    }
};

module.exports = model;