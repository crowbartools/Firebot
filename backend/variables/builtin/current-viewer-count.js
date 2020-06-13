"use strict";
const logger = require("../../logwrapper");
const channelAccess = require("../../common/channel-access");

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "currentViewerCount",
        description: "Get the number of people viewing you stream.",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async () => {
        logger.debug("Getting number of viewers in chat for variable.");

        const streamerChannel = await channelAccess.getStreamerChannelData();

        return streamerChannel ? streamerChannel.viewersCurrent : 0;
    }
};

module.exports = model;
