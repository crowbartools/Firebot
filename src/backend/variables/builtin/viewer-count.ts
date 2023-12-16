import { EffectTrigger } from "../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:shoutout-sent", "twitch:shoutout-received"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "viewerCount",
        description: "The number of viewers that saw the event occur",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.viewerCount;
    }
};

module.exports = model;