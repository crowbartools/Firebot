import type { ReplaceVariable, TriggersObject } from "../../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:chat-mode-changed"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "chatModeDuration",
        description: "The duration relevant to either follower (minutes) or slow (seconds) mode.",
        triggers: triggers,
        categories: ["trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.duration;
    }
};

export default model;
