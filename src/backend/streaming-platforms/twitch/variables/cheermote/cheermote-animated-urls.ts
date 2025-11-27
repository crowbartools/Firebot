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
        handle: "cheermoteAnimatedUrls",
        examples: [
            {
                usage: "cheermoteAnimatedUrls[1]",
                description: "Get the animated URL of a specific instance of a cheermote."
            }
        ],
        description: "Outputs the animated URLs of a chat message's cheermotes from the associated command or event.",
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

        const cheermoteAnimatedUrls = messageParts.filter(p => p.type === "cheer").map(e => e.animatedUrl);

        if (target != null) {
            return cheermoteAnimatedUrls[target];
        }

        return cheermoteAnimatedUrls;
    }
};

export default model;
