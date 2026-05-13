import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = ["twitch:power-up-redemption"];
triggers["power_up"] = true;
triggers["preset"] = true;
triggers["manual"] = true;

const model: ReplaceVariable = {
    definition: {
        handle: "powerUpMessage",
        description: "The message text entered by the viewer for the power-up",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        return (
            (trigger.metadata.eventData ? trigger.metadata.eventData.messageText : trigger.metadata.messageText) || ""
        );
    }
};

export default model;
