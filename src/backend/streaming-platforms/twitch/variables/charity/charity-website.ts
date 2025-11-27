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
        handle: "charityWebsite",
        description: "The URL of the charity's website",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        const charityWebsite = (trigger.metadata.eventData && trigger.metadata.eventData.charityWebsite) || "";

        return charityWebsite;
    }
};

export default model;