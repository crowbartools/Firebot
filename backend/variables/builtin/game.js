"use strict";

const accountAccess = require("../../common/account-access");
const mixerChat = require("../../common/mixer-chat");
const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "game",
        usage: "game[username]",
        description: "Gets the current game you last played, or the last game the given user was playing.",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, username) => {
        if (username == null) {
            username = accountAccess.getAccounts().streamer.username;
        }

        let channelData = await mixerChat.getGeneralChannelData(username, false);
        return channelData.type ? channelData.type.name : "[No game set]";
    }
};

module.exports = model;