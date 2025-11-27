import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:outgoing-raid-canceled", "twitch:outgoing-raid-started", "twitch:raid-sent-off"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "raidTargetUserDisplayName",
        description: "Gets the formatted display name for the raid target",
        triggers: triggers,
        categories: ["trigger based", "user based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData?.raidTargetUserDisplayName ?? "";
    }
};

export default model;
