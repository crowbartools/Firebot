// Migration: done

"use strict";

const logger = require("../../logwrapper");
const accountAccess = require("../../common/account-access");
const twitchApi = require("../../twitch-api/client");

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "currentViewerCount",
        description: "Get the number of people viewing you stream.",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async () => {
        logger.debug("Getting number of viewers in chat for variable.");

        // get streamer user id
        const channelId = accountAccess.getAccounts().streamer.userId;

        // retrieve stream data for user id
        const twitchClient = twitchApi.getClient();
        const streamInfo = await twitchClient.getStreamByUser(channelId);

        // extract viewer count
        return streamInfo ? streamInfo.viewers : 0;
    }
};

module.exports = model;
