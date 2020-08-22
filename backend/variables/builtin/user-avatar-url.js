"use strict";

const twitchApi = require("../../twitch-api/client");
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
        const twitchClient = twitchApi.getClient();

        try {
            const userInfo = await twitchClient.helix.users.getUserByName(username);
            return userInfo.profilePictureUrl ? userInfo.profilePictureUrl : "[No Avatar Found]";
        } catch (err) {
            return "[No Avatar Found]";
        }
    }
};

module.exports = model;