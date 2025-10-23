import type { ReplaceVariable, Trigger, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:cheer", "twitch:bits-powerup-message-effect", "twitch:bits-powerup-celebration", "twitch:bits-powerup-gigantified-emote"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "cheerTotalBits",
        description: "The total amount of bits cheered by a viewer in the channel.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger: Trigger) => {
        return trigger.metadata.eventData.totalBits || 0;
    }
};

export default model;
