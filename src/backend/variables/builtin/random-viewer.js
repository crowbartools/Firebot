"use strict";
const logger = require("../../logwrapper");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const activeUserHandler = require('../../chat/chat-listeners/active-user-handler');

const model = {
    definition: {
        handle: "randomViewer",
        description: "Get a random viewer in chat.",
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: () => {
        logger.debug("Getting random viewer...");

        const onlineViewerCount = activeUserHandler.getOnlineUserCount();

        if (onlineViewerCount === 0) {
            return "[Unable to get random viewer]";
        }

        if (onlineViewerCount > 0) {
            const randomViewer = activeUserHandler.getRandomOnlineUser();
            return randomViewer ? randomViewer.username : "[Unable to get random viewer]";
        }

        return "[Unable to get random viewer]";
    }
};

module.exports = model;
