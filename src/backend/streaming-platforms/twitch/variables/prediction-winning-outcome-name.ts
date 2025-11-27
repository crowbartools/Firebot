import type { ReplaceVariable, TriggersObject } from "../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:channel-prediction-end"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "predictionWinningOutcomeName",
        description: "The name of the winning Twitch prediction outcome.",
        triggers: triggers,
        categories: ["trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return (trigger.metadata.eventData.winningOutcome as any).title;
    }
};

export default model;