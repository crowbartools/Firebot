import type { ReplaceVariable, TriggersObject } from "../../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["manual"] = true;
triggers["command"] = true;
triggers["event"] = [
    "twitch:chat-message",
    "twitch:chat-message-deleted",
    "twitch:first-time-chat",
    "twitch:announcement",
    "twitch:viewer-arrived"
];

const model : ReplaceVariable = {
    definition: {
        handle: "chatMessageId",
        description: "Outputs the chat message ID from the associated command or event.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number", "text"]
    },
    evaluator: (trigger) => {

        let chatMessageId = "";
        if (trigger.metadata.chatMessage) {
            chatMessageId = trigger.metadata.chatMessage.id;

        } else if (trigger.type === "event" || trigger.type === "manual") {
            chatMessageId = trigger.metadata.eventData.messageId as string;
        }

        return chatMessageId.trim();
    }
};

export default model;