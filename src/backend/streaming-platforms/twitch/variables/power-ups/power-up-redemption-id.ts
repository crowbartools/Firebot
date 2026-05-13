import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:power-up-redemption"];
triggers["power_up"] = true;
triggers["preset"] = true;
triggers["manual"] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "powerUpRedemptionId",
        description: "The ID of the power-up redemption",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return trigger.metadata.eventData ? trigger.metadata.eventData.redemptionId : trigger.metadata.redemptionId;
    }
};

export default model;
