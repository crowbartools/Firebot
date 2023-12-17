import { EffectTrigger } from "../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = [
    "twitch:charity-campaign-start",
    "twitch:charity-donation",
    "twitch:charity-campaign-progress",
    "twitch:charity-campaign-end"
];
triggers[EffectTrigger.MANUAL] = true;

const model = {
    definition: {
        handle: "charityWebsite",
        description: "The URL of the charity's website",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const charityWebsite = (trigger.metadata.eventData && trigger.metadata.eventData.charityWebsite) || "";

        return charityWebsite;
    }
};

module.exports = model;