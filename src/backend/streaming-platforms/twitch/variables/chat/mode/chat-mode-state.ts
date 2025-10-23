import type { ReplaceVariable, TriggersObject } from "../../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:chat-mode-changed"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "chatModeState",
        description: "The state of the chat mode, either 'enabled' or 'disabled'.",
        triggers: triggers,
        categories: ["trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.chatModeState;
    }
};

export default model;