import type { ReplaceVariable, TriggersObject } from "../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = [
    "twitch:charity-donation",
    "streamlabs:donation",
    "streamlabs:eldonation",
    "tipeeestream:donation",
    "streamelements:donation",
    "extralife:donation"
];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "donationFrom",
        description: "The name of who sent a donation",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        const from = (trigger.metadata.eventData && trigger.metadata.eventData.from) || "Unknown User";

        return from;
    }
};

export default model;