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
        handle: "isSharedChatMessage",
        description: "'true' when chat message was sent in another channel during a Shared Chat session, 'false' otherwise.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["bool"]
    },
    evaluator: (trigger) => {
        if (trigger.metadata.chatMessage) {
            return trigger.metadata.chatMessage.isSharedChatMessage;
        }
        return trigger.metadata.eventData?.chatMessage?.isSharedChatMessage ?? false;
    }
};

export default model;