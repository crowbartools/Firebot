import type { ReplaceVariable, Trigger, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = [
    "twitch:channel-reward-redemption-random-sub-emote-unlock",
    "twitch:channel-reward-redemption-chosen-sub-emote-unlock",
    "twitch:channel-reward-redemption-chosen-modified-sub-emote-unlock"
];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "unlockedEmoteName",
        description: "The name of the unlocked emote",
        categories: ["common"],
        possibleDataOutput: ["text"],
        triggers: triggers
    },
    evaluator: (trigger: Trigger) => trigger.metadata.eventData.emoteName || ""
};

export default model;
