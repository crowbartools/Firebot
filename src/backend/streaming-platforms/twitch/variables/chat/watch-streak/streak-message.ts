import type { ReplaceVariable, TriggersObject } from "../../../../../../types";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:watch-streak"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "streakMessage",
        description: "The chat message sent with a watch streak",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.streakMessage || "";
    }
};

export default model;