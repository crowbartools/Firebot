import { ReplaceVariable } from "../../../../../types/variables";
import { OutputDataType } from "../../../../../shared/variable-constants";

const api = require("../../../../twitch-api/api");
const accountAccess = require("../../../../common/account-access");
const logger = require("../../../../logwrapper");

const model : ReplaceVariable = {
    definition: {
        handle: "subNames",
        description: "Returns an array of subscriptions you currently have. Items contain 'username', 'tier' and 'isGift' properties",
        usage: "subNames",
        examples: [
            {
                usage: "subNames",
                description: "Returns: [{username:firebottle, displayname: FireBottle, tier:2000, isGift:false}, {username:ebiggz, displayname: EBiggz, tier:1000,isGift:true},{username:sreject, displayname:SReject, tier:3000, isGift:false},{username:perry, displayname:Perry, tier:1000, isGift:false}] To be used with array or custom variables"
            }
        ],
        possibleDataOutput: [OutputDataType.TEXT]
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
                    displayname: sub.userDisplayName,
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