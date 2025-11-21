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
        handle: "charityLogo",
        description: "A URL to a PNG image of the charity's logo",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        const charityLogo = (trigger.metadata.eventData && trigger.metadata.eventData.charityLogo) || "";

        return charityLogo;
    }
};

export default model;