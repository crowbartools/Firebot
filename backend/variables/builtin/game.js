// Migration: done

"use strict";

const twitchChannels = require("../../twitch-api/resource/channels");
const accountAccess = require("../../common/account-access");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "game",
        description: "Gets the current game set for your channel",
        examples: [
            {
                usage: "game[$target]",
                description: "When in a command, gets the game set for the target user."
            },
            {
                usage: "game[$user]",
                description: "Gets the game set for associated user (Ie who triggered command, pressed button, etc)."
            },
            {
                usage: "game[ChannelOne]",
                description: "Gets the game set for a specific channel."
            }
        ],
        categories: [VariableCategory.COMMON, VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, username) => {
        if (username == null) {
            username = accountAccess.getAccounts().streamer.username;
        }

        const channelInfo = await twitchChannels.getChannelInformationByUsername(username);

        return channelInfo != null ? channelInfo.gameName : "";
    }
};

module.exports = model;