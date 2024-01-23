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
        handle: "charityCampaignGoal",
        description: "The goal amount for the current charity campaign",
        triggers: triggers,
        categories: [VariableCategory.COMMON, VariableCategory.TRIGGER],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (trigger) => {
        let charityCampaignGoal = 0;
        if (trigger.metadata.eventData && trigger.metadata.eventData.targetTotalAmount) {
            charityCampaignGoal = trigger.metadata.eventData.targetTotalAmount;
        } else {
            try {
                charityCampaignGoal = await twitchApi.charity.getCurrentCharityFundraiserGoal();
            } catch (err) {
                return 0;
            }
        }

        charityCampaignGoal = charityCampaignGoal ?? 0;

        return charityCampaignGoal;
    }
};

export default model;