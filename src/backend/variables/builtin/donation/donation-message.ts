import type { ReplaceVariable, TriggersObject } from "../../../../types/variables";

const triggers: TriggersObject = {};
triggers["event"] = [
    "streamlabs:donation",
    "streamlabs:eldonation",
    "tipeeestream:donation",
    "streamelements:donation",
    "extralife:donation"
];
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "donationMessage",
        description: "The message from a donation",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger) => {
        const donationMessage = (trigger.metadata.eventData && trigger.metadata.eventData.donationMessage) || "";

        return donationMessage;
    }
};

export default model;
