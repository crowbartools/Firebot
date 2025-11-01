import type { ReplaceVariable, Trigger, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:outgoing-raid-canceled", "twitch:outgoing-raid-started", "twitch:raid-sent-off"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "raidTargetUsername",
        description: "The associated user (if there is one) for the given trigger",
        triggers: triggers,
        categories: ["trigger based", "common", "user based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger: Trigger) => {
        return trigger.metadata.eventData?.raidTargetUsername;
    }
};

export default model;
