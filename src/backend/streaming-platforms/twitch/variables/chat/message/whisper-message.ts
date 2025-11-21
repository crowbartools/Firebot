import type { ReplaceVariable, TriggersObject } from "../../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:whisper"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "whisperMessage",
        description: "The message included with the whisper.",
        triggers: triggers,
        categories: ["trigger based", "common"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        const whisperMessage = trigger.metadata.eventData.message || "";
        return whisperMessage;
    }
};

export default model;