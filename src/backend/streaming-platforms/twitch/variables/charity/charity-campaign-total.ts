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
        handle: "charityCampaignTotal",
        description: "The total amount raised so far during the current charity campaign",
        triggers: triggers,
        categories: ["common", "trigger based"],
        possibleDataOutput: ["number"]
    },
    evaluator: async (trigger) => {
        let charityCampaignTotal = 0;
        if (trigger.metadata.eventData && trigger.metadata.eventData.currentTotalAmount) {
            charityCampaignTotal = trigger.metadata.eventData.currentTotalAmount as number;
        } else {
            try {
                charityCampaignTotal = await TwitchApi.charity.getCurrentCharityFundraiserTotal();
            } catch {
                return 0;
            }
        }

        charityCampaignTotal = charityCampaignTotal ?? 0;

        return charityCampaignTotal;
    }
};

export default model;