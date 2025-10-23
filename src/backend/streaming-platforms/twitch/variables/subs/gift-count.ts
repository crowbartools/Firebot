import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:community-subs-gifted"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "giftCount",
        description: "The number of subs gifted.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.subCount || 0;
    }
};

export default model;
