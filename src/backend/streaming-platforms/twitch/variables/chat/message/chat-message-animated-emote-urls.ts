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
        handle: "chatMessageAnimatedEmoteUrls",
        examples: [
            {
                usage: "chatMessageAnimatedEmoteUrls[1]",
                description: "Get the URL of a specific animated emote. If the emote isn't animated, the result will return an empty string."
            }
        ],
        description: "Outputs the URLs of a chat message's animated emotes from the associated command or event. Any emotes that don't have an animated version will return an empty string.",
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

        const emoteUrls = messageParts.filter(p => p.type === "emote").map(e => e.animatedUrl ?? "");

        if (target != null) {
            return emoteUrls[target];
        }

        return emoteUrls;
    }
};

export default model;