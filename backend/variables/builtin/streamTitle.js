"use strict";

const accountAccess = require("../../common/account-access");
const channelAccess = require("../../common/channel-access");
const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "streamTitle",
        usage: "streamTitle[username]",
        description: "Gets the current stream title for your channel or the given usernames channel",
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