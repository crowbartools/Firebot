import type { ReplaceVariable, TriggersObject } from "../../../../../../types/variables";

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
        handle: "chatMessageEmoteUrls",
        examples: [
            {
                usage: "chatMessageEmoteUrls[1]",
                description: "Get the url of a specific emote."
            }
        ],
        description: "Outputs the urls of a chat message's emotes from the associated command or event.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger, target: null | string) => {
        let messageParts = [];
        if (trigger.type === "command") {
            messageParts = trigger.metadata.chatMessage.parts;
        } else if (trigger.type === "event") {
            messageParts = trigger.metadata.eventData.chatMessage.parts;
        }

        const emoteUrls = messageParts.filter(p => p.type === "emote" || p.type === "third-party-emote").map(e => e.url);

        if (target != null) {
            return emoteUrls[target];
        }

        return emoteUrls;
    }
};

export default model;
