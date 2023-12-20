import { EffectTrigger } from "../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = ["twitch:channel-poll-end"];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "pollWinningChoiceName",
        description: "The name of the winning Twitch poll choice.",
        triggers: triggers,
        categories: [VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        return trigger.winningChoice.title;
    }
};

module.exports = model;