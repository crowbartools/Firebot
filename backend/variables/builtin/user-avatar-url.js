"use strict";

const twitchApi = require("../../twitch-api/api");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "userAvatarUrl",
        usage: "userAvatarUrl",
        description: "Gets the url for the avatar to the current user. Optionally pass in a username.",
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, username) => {
        if (username == null) {
            username = trigger.metadata.username;
        }
        const twitchClient = twitchApi.getClient();

        try {
            const userInfo = await twitchClient.users.getUserByName(username);
            return userInfo.profilePictureUrl ? userInfo.profilePictureUrl : "[No Avatar Found]";
        } catch (err) {
            return "[No Avatar Found]";
        }
    }
};

module.exports = model;