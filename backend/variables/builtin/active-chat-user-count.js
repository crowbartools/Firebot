// Migration: info needed

"use strict";
const logger = require("../../logwrapper");

const activeViewerHandler = require("../../chat/chat-listeners/active-user-handler");

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "activeChatUserCount",
        description: "Get the number of active viewers in chat.",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async () => {
        logger.debug("Getting number of active viewers in chat.");

        return activeViewerHandler.getActiveUserCount() || 0;
    }
};

module.exports = model;
