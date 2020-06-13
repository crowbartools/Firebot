"use strict";

const mixerApi = require("../../mixer-api/api");
const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "userAvatarUrl",
        usage: "userAvatarUrl",
        description: "Gets the url for the avatar to the current user. Optionally pass in a username.",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, username) => {
        if (username == null) {
            username = trigger.metadata.username;
        }

        try {
            const channelData = await mixerApi.channels.getChannel(username);
            return channelData ? channelData.user.avatarUrl : "";
        } catch (err) {
            return "[No Avatar Found]";
        }
    }
};

module.exports = model;