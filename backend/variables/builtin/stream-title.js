"use strict";

const accountAccess = require("../../common/account-access");
const channelAccess = require("../../common/channel-access");
const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "streamTitle",
        usage: "streamTitle",
        description: "Gets the current stream title for your channel",
        examples: [
            {
                usage: "streamTitle[$target]",
                description: "When in a command, gets the stream title for the target channel."
            },
            {
                usage: "streamTitle[$user]",
                description: "Gets the stream title  for associated user (Ie who triggered command, pressed button, etc)."
            },
            {
                usage: "streamTitle[ChannelOne]",
                description: "Gets the stream title for a specific channel."
            }
        ],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, username) => {
        if (username == null) {
            username = accountAccess.getAccounts().streamer.username;
        }

        try {
            let channelData = await channelAccess.getMixerAccountDetailsByUsername(username);
            return channelData.name ? channelData.name : "[No title set]";
        } catch (err) {
            return "[No title set]";
        }
    }
};

module.exports = model;