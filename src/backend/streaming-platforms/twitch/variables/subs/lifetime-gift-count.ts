import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = [
    "twitch:subs-gifted",
    "twitch:community-subs-gifted"
];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "lifetimeGiftCount",
        description: "The total number of subs the user has gifted over the lifetime of the channel.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.lifetimeGiftCount || 0;
    }
};

export default model;
