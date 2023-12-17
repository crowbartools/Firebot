import { EffectTrigger } from "../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:channel-prediction-end"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "preditionWinningOutcomeName",
        description: "The name of the winning Twitch prediction outcome.",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.winningOutcome.title;
    }
};

module.exports = model;