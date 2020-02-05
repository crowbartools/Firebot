"use strict";
const logger = require("../../logwrapper");
const MixerChat = require('../../common/mixer-chat');

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "numViewers",
        description: "Get the number viewers in chat.",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async () => {
        logger.debug("Getting number of viewers in chat for variable.");

        let viewers = MixerChat.getCurrentViewers();

        if (viewers && viewers.length > 0) {
            return viewers.length;
        }

        return 0;
    }
};

module.exports = model;
