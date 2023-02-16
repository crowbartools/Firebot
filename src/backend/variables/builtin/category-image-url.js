"use strict";

const twitchApi = require("../../twitch-api/api");
const accountAccess = require("../../common/account-access");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "categoryImageUrl",
        usage: "categoryImageUrl",
        description: "Gets the url for the image url of your last streamed category.",
        examples: [
            {
                usage: "categoryImageUrl[$target]",
                description: "When in a command, gets the image url of the last streamed category for the target channel."
            },
            {
                usage: "categoryImageUrl[$user]",
                description: "Gets the image url of the last streamed category for associated user (Ie who triggered command, pressed button, etc)."
            },
            {
                usage: "categoryImageUrl[ebiggz]",
                description: "Gets the image url of the last streamed category for a specific channel."
            },
            {
                usage: "categoryImageUrl[ebiggz, 285x380]",
                description: "Get a different image size (use aspect ratio 4:3). Default is 285x380."
            }
        ],
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (_, username, size = "285x380") => {
        if (username == null) {
            username = accountAccess.getAccounts().streamer.username;
        }

        try {
            const channelInfo = await twitchApi.channels.getChannelInformationByUsername(username);
            const category = await twitchApi.categories.getCategoryById(channelInfo.gameId, size);

            return category.boxArtUrl ? category.boxArtUrl : "[No Category Image Found]";
        } catch (err) {
            return "[No Category Image Found]";
        }
    }
};

module.exports = model;