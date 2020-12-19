// Migration: done

'use strict';

const { OutputDataType } = require("../../../shared/variable-contants");

const api = require("../../twitch-api/api");
const accountAccess = require("../../common/account-access");

const model = {
    definition: {
        handle: "followCount",
        description: "The number of follows you currently have.",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async () => {
        const { streamer } = accountAccess.getAccounts();
        let count = 0;
        try {
            const response = await api.getClient().helix.users.getFollows({
                followedUser: streamer.userId
            });
            if (response) {
                count = response.total;
            }
        } catch {
            // silently fail
        }

        return count;
    }
};

module.exports = model;