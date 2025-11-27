import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = [
    "twitch:hype-train-end",
    "twitch:hype-train-progress",
    "twitch:hype-train-start"
];
triggers["manual"] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "isSharedTrain",
        description: "`true` when the hype train is shared with other broadcasters, `false` otherwise.",
        triggers: triggers,
        categories: ["trigger based"],
        possibleDataOutput: ["bool"]
    },
    evaluator: (trigger) => {
        return trigger.metadata?.eventData?.isSharedTrain ?? false;
    }
};

export default model;
