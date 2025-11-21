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
        handle: "isTreasureTrain",
        description: "`true` when the hype train is a Treasure Train, `false` otherwise.",
        triggers: triggers,
        categories: ["trigger based"],
        possibleDataOutput: ["bool"]
    },
    evaluator: (trigger) => {
        return trigger.metadata?.eventData?.isTreasureTrain ?? false;
    }
};

export default model;
