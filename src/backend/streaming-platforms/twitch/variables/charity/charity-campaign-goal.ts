import type { ReplaceVariable, TriggersObject } from "../../../../../types/variables";
import { TwitchApi } from "../../api";

const triggers: TriggersObject = {};
triggers["event"] = [
    "twitch:charity-campaign-start",
    "twitch:charity-campaign-progress",
    "twitch:charity-campaign-end"
];
triggers["command"] = true;
triggers["preset"] = true;
triggers["manual"] = true;

const model : ReplaceVariable = {
    definition: {
        handle: "charityCampaignGoal",
        description: "The goal amount for the current charity campaign",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: async (trigger) => {
        let charityCampaignGoal = 0;
        if (trigger.metadata.eventData && trigger.metadata.eventData.targetTotalAmount) {
            charityCampaignGoal = trigger.metadata.eventData.targetTotalAmount as number;
        } else {
            try {
                charityCampaignGoal = await TwitchApi.charity.getCurrentCharityFundraiserGoal();
            } catch {
                return 0;
            }
        }

        charityCampaignGoal = charityCampaignGoal ?? 0;

        return charityCampaignGoal;
    }
};

export default model;