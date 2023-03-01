// Migration: done

'use strict';

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const api = require("../../twitch-api/api");
const accountAccess = require("../../common/account-access");
const logger = require("../../logwrapper");

const model = {
    definition: {
        handle: "subPoints",
        description: "The number of sub points you currently have.",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async () => {
        const { streamer } = accountAccess.getAccounts();
        let points = 0;
        try {
            const response = await api.streamerClient.subscriptions
                .getSubscriptionsPaginated(streamer.channelId).getAll();
            if (response && response.length) {
                response.forEach(sub => {
                    switch (sub.tier) {
                    case "Prime":
                    case "1000":
                        points += 1;
                        break;
                    case "2000":
                        points += 2;
                        break;
                    case "3000":
                        points += 6;
                        break;
                    }
                });
            }
        } catch (err) {
            logger.error("Error while fetching streamer subscriptions", err);
        }

        // Streamer is included in the data, so we need to deduct 6 points for that.
        return points - 6;
    }
};

module.exports = model;