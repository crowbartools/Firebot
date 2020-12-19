// Migration: done

'use strict';

const { OutputDataType } = require("../../../shared/variable-contants");

const api = require("../../twitch-api/api");
const accountAccess = require("../../common/account-access");

const model = {
    definition: {
        handle: "subCount",
        description: "The number of subs you currently have.",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async () => {
        const { streamer } = accountAccess.getAccounts();
        let count = 0;
        try {
            const response = await api.getClient().helix.subscriptions
                .getSubscriptions(streamer.channelId);
            if (response && response.data) {
                count = response.data.length;
            }
        } catch {
            // silently fail
        }

        return count;
    }
};

module.exports = model;