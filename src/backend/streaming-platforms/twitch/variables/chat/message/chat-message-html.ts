import escapeHTML from "escape-html";
import type {
    ReplaceVariable,
    TriggersObject,
    FirebotChatMessagePart
} from "../../../../../../types";

const triggers: TriggersObject = {};
triggers["manual"] = true;
triggers["command"] = true;
triggers["event"] = [
    "twitch:chat-message",
    "twitch:first-time-chat",
    "firebot:highlight-message",
    "twitch:viewer-arrived"
];

const model : ReplaceVariable = {
    definition: {
        handle: "chatMessageHtml",
        description: "Outputs the chat message from the associated command or event formatted as HTML.",
        triggers: triggers,
        categories: ["advanced", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        let messageParts = [];
        if (trigger.type === "command") {
            messageParts = trigger.metadata.chatMessage.parts;
        } else if (trigger.type === "event") {
            messageParts = trigger.metadata.eventData.chatMessage.parts;
        }

        const formattedChatMessageParts = [];

        for (const part of messageParts as FirebotChatMessagePart[]) {
            switch (part.type) {
                case "emote":
                case "third-party-emote":
                    formattedChatMessageParts.push(`<img src="${part.animatedUrl ?? part.url}">`);
                    break;

                case "cheermote":
                    formattedChatMessageParts.push(`<img src="${part.animatedUrl ?? part.url}"><strong style="color: ${part.color}">${part.amount}</strong>`);
                    break;

                case "link":
                    formattedChatMessageParts.push(`<a href="${part.url}">${escapeHTML(part.url)}</a>`);
                    break;

                default:
                    formattedChatMessageParts.push(escapeHTML(part.text));
            }
        }

        return formattedChatMessageParts.join(" ");
    }
};

export default model;