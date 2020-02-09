"use strict";
const logger = require("../../logwrapper");
const MixerChat = require('../../common/mixer-chat');

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "currentViewerCount",
        description: "Get the number of people viewing you stream.",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async () => {
        logger.debug("Getting number of viewers in chat for variable.");

        let viewersCount = await MixerChat.getCurrentViewers();

        return viewersCount;
    }
};

module.exports = model;
