import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:hype-train-level-up"];
triggers["manual"] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "hypeTrainPreviousLevel",
        description: "The previous level of the current Twitch Hype Train.",
        triggers: triggers,
        categories: ["trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.previous;
    }
};

export default model;