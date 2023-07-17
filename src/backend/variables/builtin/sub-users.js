'use strict';
const { OutputDataType } = require("../../../shared/variable-constants");
const api = require("../../twitch-api/api");
const accountAccess = require("../../common/account-access");
const logger = require("../../logwrapper");
const model = {
    definition: {
        handle: "subNames",
        description: "Returns an array of user names, of all the subs you currently have. Items contain 'username', 'tier' and 'isGift' properties",
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
                    tier: sub.tier,
                    isGift: sub.isGift
                }));
            }
        }
        catch (err) {
            logger.error("Error while fetching streamer subscriptions", err);
        }
        return JSON.stringify(viewers);
    }
};
module.exports = model;
//# sourceMappingURL=sub-users.js.map