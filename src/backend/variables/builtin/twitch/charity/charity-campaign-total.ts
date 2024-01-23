import { ReplaceVariable } from "../../../../../types/variables";
import { EffectTrigger } from "../../../../../shared/effect-constants";
import { OutputDataType, VariableCategory } from "../../../../../shared/variable-constants";
import twitchApi from "../../../../twitch-api/api";

const triggers = {};
triggers[EffectTrigger.EVENT] = [
    "twitch:charity-campaign-start",
    "twitch:charity-campaign-progress",
    "twitch:charity-campaign-end"
];
triggers[EffectTrigger.COMMAND] = true;
triggers[EffectTrigger.PRESET_LIST] = true;
triggers[EffectTrigger.MANUAL] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "charityCampaignTotal",
        description: "The total amount raised so far during the current charity campaign",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (trigger) => {
        let charityCampaignTotal = 0;
        if (trigger.metadata.eventData && trigger.metadata.eventData.currentTotalAmount) {
            charityCampaignTotal = trigger.metadata.eventData.currentTotalAmount;
        } else {
            try {
                charityCampaignTotal = await twitchApi.charity.getCurrentCharityFundraiserTotal();
            } catch (err) {
                return 0;
            }
        }

        charityCampaignTotal = charityCampaignTotal ?? 0;

        return charityCampaignTotal;
    }
};

export default model;