import type { ReplaceVariable } from "../../../../../types/variables";
import { TwitchApi } from "../../api";
import logger from "../../../../logwrapper";

const model : ReplaceVariable = {
    definition: {
        handle: "subNames",
        description: "Returns an array of subscribers you currently have. Items contain `username`, `tier` and `isGift` properties.",
        usage: "subNames",
        examples: [
            {
                usage: "subNames",
                description: 'Returns: [{username: "firebottle", displayname: "FireBottle", tier: 2000, isGift:false}, {username: "ebiggz", displayname: "EBiggz", tier: 1000, isGift:true}] To be used with array or custom variables.'
            }
        ],
        possibleDataOutput: ["array"]
    },
    evaluator: async () => {
        let viewers: Array<{
            username: string;
            displayname: string;
            tier: string;
            isGift: boolean;
        }> = [];
        try {
            const response = await TwitchApi.subscriptions.getSubscriptions();
            if (response && response.length) {
                viewers = response.map(sub => ({
                    username: sub.userName,
                    displayname: sub.userDisplayName || sub.userName,
                    tier: sub.tier,
                    isGift: sub.isGift
                }));
            }
        } catch (err) {
            logger.error("Error while fetching streamer subscriptions", err);
        }

        return viewers;
    }
};

export default model;