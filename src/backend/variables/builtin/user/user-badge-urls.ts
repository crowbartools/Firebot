import type { ReplaceVariable, TriggersObject } from "../../../../types/variables";

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
        handle: "userBadgeUrls",
        examples: [
            {
                usage: "userBadgeUrls[1]",
                description: "Get the URL of a chatter's selected badge image."
            }
        ],
        description: "Outputs the URLs of a chatter's selected badge images from the associated command or event.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger, target: null | string = null) => {
        let messageParts = [];
        if (trigger.type === "command") {
            messageParts = trigger.metadata.chatMessage.badges;
        } else if (trigger.type === "event") {
            messageParts = trigger.metadata.eventData.chatMessage.badges;
        }
        const badgeUrls = messageParts.map(e => e.url);

        if (target != null) {
            return badgeUrls[target];
        }

        return badgeUrls;
    }
};

export default model;