import type { ReplaceVariable, Trigger, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:cheer", "twitch:bits-powerup-message-effect", "twitch:bits-powerup-celebration", "twitch:bits-powerup-gigantified-emote"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "cheerBitsAmount",
        description: "The amount of bits in the cheer.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger: Trigger) => {
        const bits = trigger.metadata.eventData.bits || 0;
        return bits;
    }
};

export default model;
