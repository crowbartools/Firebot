// Deprecated
import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:subs-gifted"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "giftSubMonths",
        description: "(Deprecated: removed from Twitch data) The total number of months the gift receiver has been subscribed since the beginning of time.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number"],
        hidden: true
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.giftSubMonths ?? 1;
    }
};

export default model;
