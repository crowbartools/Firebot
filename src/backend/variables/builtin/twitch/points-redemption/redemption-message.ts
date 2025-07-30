import { ReplaceVariable, Trigger } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

import { EffectTrigger } from "../../../../../shared/effect-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = [
    "twitch:channel-points-redemption-send-highlighted-message"
];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "redemptionMessage",
        description: "The message associated with the channel points redemption",
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT],
        triggers: triggers
    },
    evaluator: (trigger: Trigger) => trigger.metadata.eventData.messageText || ""
};

export default model;
