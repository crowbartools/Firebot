"use strict";

const accountAccess = require("../../common/account-access");
const mixerChat = require("../../common/mixer-chat");
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
            let avatarUrl = await mixerChat.getUserAvatarUrl(username);
            return avatarUrl;
        } catch (err) {
            return "[No Avatar Found]";
        }
    }
};

module.exports = model;