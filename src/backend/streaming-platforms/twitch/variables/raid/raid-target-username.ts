import { ReplaceVariable, Trigger } from "../../../../../types/variables";

import { TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:outgoing-raid-canceled", "twitch:outgoing-raid-started", "twitch:raid-sent-off"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "raidTargetUsername",
        description: "The associated user (if there is one) for the given trigger",
        triggers: triggers,
        categories: ["common", "user based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger: Trigger) => {
        return trigger.metadata.eventData?.raidTargetUsername;
    }
};

export default model;
