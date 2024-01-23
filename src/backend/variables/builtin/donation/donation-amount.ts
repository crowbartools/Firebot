import { ReplaceVariable } from "../../../../types/variables";
import { EffectTrigger } from "../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const triggers = {};
triggers[EffectTrigger.EVENT] = [
    "twitch:charity-donation",
    "streamlabs:donation",
    "streamlabs:eldonation",
    "tipeeestream:donation",
    "streamelements:donation",
    "extralife:donation"
];
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "donationAmount",
        description: "The amount of a donation from Twitch/StreamLabs/Tipeee/StreamElements/ExtraLife",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.NUMBERS, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (trigger) => {
        const donationAmount = (trigger.metadata.eventData && trigger.metadata.eventData.donationAmount) || 0;

        return donationAmount;
    }
};

export default model;