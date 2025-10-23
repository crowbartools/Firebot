import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:sub"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "subCurrentStreak",
        description: "Number of consecutive months a user has been subscribed to your channel.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.streak || 1;
    }
};

export default model;
