import type { ReplaceVariable, TriggersObject } from "../../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["manual"] = true;
triggers["command"] = true;
triggers["event"] = [
    "twitch:chat-message",
    "twitch:chat-message-deleted",
    "twitch:first-time-chat",
    "firebot:highlight-message",
    "twitch:announcement",
    "twitch:viewer-arrived"
];

const model : ReplaceVariable = {
    definition: {
        handle: "chatMessage",
        description: "Outputs the chat message from the associated command or event.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number", "text"]
    },
    evaluator: (trigger) => {

        let chatMessage = "";
        if (trigger.metadata.chatMessage) {
            chatMessage = trigger.metadata.chatMessage.rawText;

        } else if (trigger.type === "command") {

            //if trigger is command, rebuild chat message with trigger and args
            const userCommand = trigger.metadata.userCommand;
            chatMessage = `${userCommand.trigger} ${userCommand.args.join(" ")}`;

        } else if (trigger.type === "event" || trigger.type === "manual") {
            // if trigger is event/manual event, build chat message from chat event data
            chatMessage = trigger.metadata.eventData.messageText as string;
        }

        return chatMessage.trim();
    }
};

export default model;