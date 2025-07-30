import { ReplaceVariable, Trigger } from "../../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";

import { EffectTrigger } from "../../../../../shared/effect-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = [
    "twitch:channel-points-redemption-random-sub-emote-unlock",
    "twitch:channel-points-redemption-chosen-sub-emote-unlock",
    "twitch:channel-points-redemption-chosen-modified-sub-emote-unlock"
];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "unlockedEmoteUrl",
        description: "The URL of the unlocked emote",
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT],
        triggers: triggers
    },
    evaluator: (trigger: Trigger) => trigger.metadata.eventData.emoteUrl || ""
};

export default model;
