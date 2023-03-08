// Migration: done

'use strict';

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const api = require("../../twitch-api/api");
const accountAccess = require("../../common/account-access");

const model = {
    definition: {
        handle: "subCount",
        description: "The number of subs you currently have.",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async () => {
        const { streamer } = accountAccess.getAccounts();
        let count = 0;
        try {
            const response = await api.streamerClient.subscriptions
                .getSubscriptionsPaginated(streamer.channelId).getAll();
            if (response && response.length) {
                count = response.length;
            }
        } catch {
            // silently fail
        }

        return count;
    }
};

module.exports = model;