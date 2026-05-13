import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:power-up-redemption"];
triggers["power_up"] = true;
triggers["preset"] = true;
triggers["manual"] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "powerUpName",
        description: "The name of the power-up",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData ? trigger.metadata.eventData.powerUpName : trigger.metadata.powerUpName;
    }
};

export default model;
