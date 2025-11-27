import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = [
    "twitch:channel-reward-redemption",
    "twitch:channel-reward-redemption-fulfilled",
    "twitch:channel-reward-redemption-canceled",
    "twitch:channel-reward-redemption-send-highlighted-message"
];
triggers["channel_reward"] = true;
triggers["preset"] = true;
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "rewardMessage",
        description: "The reward message text",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return (trigger.metadata.eventData ?
            trigger.metadata.eventData.messageText :
            trigger.metadata.messageText) || "";
    }
};

export default model;