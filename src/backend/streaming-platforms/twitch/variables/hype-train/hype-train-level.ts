import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:hype-train-start", "twitch:hype-train-progress", "twitch:hype-train-end"];
triggers["manual"] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "hypeTrainLevel",
        description: "The level of the current Twitch Hype Train.",
        triggers: triggers,
        categories: ["trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.level;
    }
};

export default model;