// Migration: done

"use strict";

const twitchApi = require("../../twitch-api/client");
const accountAccess = require("../../common/account-access");
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
        const twitchClient = twitchApi.getClient();

        try {
            const streamInfo = await twitchClient.helix.streams.getStreamByUserName(username);
            return streamInfo.title ? streamInfo.title : "[No title set]";

        } catch (ignore) {
            return "[No title set]";
        }
    }
};

module.exports = model;