import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType } from "../../../../../shared/variable-constants";

const api = require("../../../../twitch-api/api");
const accountAccess = require("../../../../common/account-access");
const logger = require("../../../../logwrapper");

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
        possibleDataOutput: [OutputDataType.ARRAY]
    },
    evaluator: async () => {
        const { streamer } = accountAccess.getAccounts();
        let viewers = [];
        try {
            const response = await api.streamerClient.subscriptions
                .getSubscriptionsPaginated(streamer.channelId).getAll();
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