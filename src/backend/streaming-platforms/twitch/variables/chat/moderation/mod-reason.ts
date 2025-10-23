import type { ReplaceVariable, TriggersObject } from "../../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:banned", "twitch:timeout"];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "modReason",
        description: "The reason why the user was banned or timed out.",
        triggers: triggers,
        categories: ["user based", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData.modReason;
    }
};

export default model;
