import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:sub"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "subMonths",
        description: "The total number of months the user has been subscribed since the beginning of time.",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.totalMonths || 1;
    }
};

export default model;
