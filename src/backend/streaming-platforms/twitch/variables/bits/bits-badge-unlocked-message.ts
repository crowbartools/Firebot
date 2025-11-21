import type { ReplaceVariable, Trigger, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:bits-badge-unlocked"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "bitsBadgeUnlockedMessage",
        description: "The message included when someone shares that they unlocked a new bits badge.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger: Trigger) => {
        return trigger.metadata.eventData.message || "";
    }
};

export default model;
