import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";
import type { FirebotParsedMessagePart } from "../../../../../types/chat";

const triggers: TriggersObject = {};
triggers["manual"] = true;
triggers["command"] = true;
triggers["event"] = [
    "twitch:chat-message",
    "twitch:first-time-chat",
    "firebot:highlight-message",
    "twitch:viewer-arrived"
];

const model: ReplaceVariable = {
    definition: {
        handle: "cheermoteColors",
        examples: [
            {
                usage: "cheermoteColors[1]",
                description: "Get the text color (in #RRGGBB format) of a specific instance of a cheermote."
            }
        ],
        description: "Outputs the text colors (in #RRGGBB format) of a chat message's cheermotes from the associated command or event.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger, target: number = null) => {
        let messageParts: FirebotParsedMessagePart[] = [];
        if (trigger.type === "command") {
            messageParts = trigger.metadata.chatMessage.parts;
        } else if (trigger.type === "event") {
            messageParts = trigger.metadata.eventData.chatMessage.parts;
        }

        const cheermoteColors = messageParts.filter(p => p.type === "cheer").map(e => e.color);

        if (target != null) {
            return cheermoteColors[target];
        }

        return cheermoteColors;
    }
};

export default model;
