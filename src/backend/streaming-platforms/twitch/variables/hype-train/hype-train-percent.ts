import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:hype-train-start", "twitch:hype-train-progress"];
triggers["manual"] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "hypeTrainPercent",
        description: "The percent completion of the current level of the Twitch Hype Train.",
        triggers: triggers,
        categories: ["trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        const progress = trigger.metadata.eventData.progress as number;
        const goal = trigger.metadata.eventData.goal as number;
        return Math.floor((progress / goal) * 100);
    }
};

export default model;