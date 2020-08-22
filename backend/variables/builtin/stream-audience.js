// Migration: todo - Needs implementation info

"use strict";

const accountAccess = require("../../common/account-access");
const { OutputDataType } = require("../../../shared/variable-contants");
const mixerApi = require("../../mixer-api/api");

const model = {
    definition: {
        handle: "streamAudience",
        description: "Gets the audience level (Family Friendly/Teen/18+) set for your channel",
        examples: [
            {
                usage: "streamAudience[$target]",
                description: "When in a command, gets the audience level set for the target user."
            },
            {
                usage: "streamAudience[$user]",
                description: "Gets the audience level set for associated user (Ie who triggered command, pressed button, etc)."
            },
            {
                usage: "streamAudience[ChannelOne]",
                description: "Gets the audience level set for a specific channel."
            }
        ],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, username) => {
        if (username == null) {
            username = accountAccess.getAccounts().streamer.username;
        }

        const channelData = await mixerApi.channels.getChannel(username);

        let audienceDisplay;
        if (channelData.audience) {
            if (channelData.audience === 'family') {
                audienceDisplay = "Family Friendly";
            } else if (channelData.audience === 'teen') {
                audienceDisplay = "Teen";
            } else {
                audienceDisplay = channelData.audience;
            }
        }

        return audienceDisplay || "[No Audience set]";
    }
};

module.exports = model;