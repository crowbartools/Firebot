"use strict";

const accountAccess = require("../../common/account-access");
const { OutputDataType } = require("../../../shared/variable-contants");
const mixerApi = require("../../mixer-api/api");

const model = {
    definition: {
        handle: "game",
        description: "Gets the current game set for your channel",
        examples: [
            {
                usage: "game[username]",
                description: "Gets the game set for the given usernames channel."
            }
        ],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, username) => {
        if (username == null) {
            username = accountAccess.getAccounts().streamer.username;
        }

        const channelData = await mixerApi.channels.getChannel(username);
        return channelData.type ? channelData.type.name : "[No game set]";
    }
};

module.exports = model;