import { EffectTrigger } from "../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:hype-train-start","twitch:hype-train-progress"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "hypeTrainPercent",
        description: "The percent completion of the current level of the Twitch Hype Train.",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        return Math.floor((trigger.metadata.eventData.progress / trigger.metadata.eventData.goal) * 100);
    }
};

module.exports = model;