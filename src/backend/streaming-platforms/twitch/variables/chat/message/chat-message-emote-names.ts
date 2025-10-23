import type { ReplaceVariable , TriggersObject } from "../../../../../../types/variables";

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
        handle: "chatMessageEmoteNames",
        examples: [
            {
                usage: "chatMessageEmoteNames[1]",
                description: "Get the name of a specific emote."
            }
        ],
        description: "Outputs the names of a chat message's emotes from the associated command or event.",
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

        const emoteNames = messageParts.filter(p => p.type === "emote" || p.type === "third-party-emote").map(e => e.name);

        if (target != null) {
            return emoteNames[target];
        }

        return emoteNames;
    }
};

export default model;