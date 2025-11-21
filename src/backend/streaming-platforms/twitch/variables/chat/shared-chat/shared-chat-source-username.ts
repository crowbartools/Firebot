import { FirebotChatMessage } from "../../../../../../types/chat";
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
        handle: "sharedChatSourceUsername",
        description: "Outputs the username for the source user of a shared chat message, or null if not a shared chat message.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text", "null"]
    },
    evaluator: (trigger) => {

        let chatMessage: FirebotChatMessage | null;
        if (trigger.metadata.chatMessage) {
            chatMessage = trigger.metadata.chatMessage;

        } else if (trigger.type === "event" || trigger.type === "manual") {
            chatMessage = trigger.metadata.eventData.chatMessage;
        }

        if (!chatMessage || !chatMessage.sharedChatRoomUsername) {
            return null;
        }

        return chatMessage.sharedChatRoomUsername;
    }
};

export default model;