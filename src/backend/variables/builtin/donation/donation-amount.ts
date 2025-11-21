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
        handle: "donationAmount",
        description: "The amount of a donation",
        triggers: triggers,
        categories: ["common", "numbers", "trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: (trigger) => {
        const donationAmount = (trigger.metadata.eventData && trigger.metadata.eventData.donationAmount) || 0;

        return donationAmount;
    }
};

export default model;