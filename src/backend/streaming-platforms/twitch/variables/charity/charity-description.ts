import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = [
    "twitch:charity-campaign-start",
    "twitch:charity-donation",
    "twitch:charity-campaign-progress",
    "twitch:charity-campaign-end"
];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "charityDescription",
        description: "A description of the charity",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        const charityDescription = (trigger.metadata.eventData && trigger.metadata.eventData.charityDescription) || "";

        return charityDescription;
    }
};

export default model;