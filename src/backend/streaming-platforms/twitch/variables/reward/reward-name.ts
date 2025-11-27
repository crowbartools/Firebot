import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = [
    "twitch:channel-reward-redemption",
    "twitch:channel-reward-redemption-fulfilled",
    "twitch:channel-reward-redemption-canceled"
];
triggers["channel_reward"] = true;
triggers["preset"] = true;
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "rewardName",
        description: "The name of the reward",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData ?
            trigger.metadata.eventData.rewardName :
            trigger.metadata.rewardName;
    }
};

export default model;