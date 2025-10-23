import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:sub"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "subMessage",
        description: "The message included with a resubscription.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.subMessage || "";
    }
};

export default model;
