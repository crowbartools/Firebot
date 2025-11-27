import type { ReplaceVariable, Trigger, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:bits-badge-unlocked"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "bitsBadgeTier",
        description: "The tier of the bits badge that was unlocked (100, 1000, 5000, etc.).",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger: Trigger) => {
        const badgeTier = trigger.metadata.eventData.badgeTier || 0;
        return badgeTier;
    }
};

export default model;
