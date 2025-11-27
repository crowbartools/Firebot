import type { ReplaceVariable, TriggersObject } from "../../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["command"] = true;
triggers["manual"] = true;

const IsWhisperVariable: ReplaceVariable = {
    definition: {
        handle: "isWhisper",
        description: "Returns `true` if the chat message that triggered a command is a whisper, otherwise returns `false`.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        const chatMessage = trigger.metadata?.eventData?.chatMessage ?? trigger.metadata?.chatMessage;
        return chatMessage?.whisper ?? false;
    }
};

export default IsWhisperVariable;