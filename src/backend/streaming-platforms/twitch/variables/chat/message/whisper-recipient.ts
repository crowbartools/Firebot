import type { ReplaceVariable, TriggersObject } from "../../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:whisper"];
triggers["manual"] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "whisperRecipient",
        description: "The account type (either 'streamer' or 'bot') that received the whisper.",
        triggers: triggers,
        categories: ["trigger based", "common"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.sentTo;
    }
};

export default model;