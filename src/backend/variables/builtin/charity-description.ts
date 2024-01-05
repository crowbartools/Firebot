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
        handle: "charityDescription",
        description: "A description of the charity",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (trigger) => {
        const charityDescription = (trigger.metadata.eventData && trigger.metadata.eventData.charityDescription) || "";

        return charityDescription;
    }
};

module.exports = model;