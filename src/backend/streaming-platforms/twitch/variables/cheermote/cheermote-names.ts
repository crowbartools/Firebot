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
        handle: "cheermoteNames",
        examples: [
            {
                usage: "cheermoteNames[1]",
                description: "Get the name of a specific instance of a cheermote."
            }
        ],
        description: "Outputs the names of a chat message's cheermotes from the associated command or event.",
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

        const cheermoteNames = messageParts.filter(p => p.type === "cheer").map(e => e.name);

        if (target != null) {
            return cheermoteNames[target];
        }

        return cheermoteNames;
    }
};

export default model;
