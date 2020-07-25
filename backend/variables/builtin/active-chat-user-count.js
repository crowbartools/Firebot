// Migration: info needed

"use strict";
const logger = require("../../logwrapper");
const activeViewerHandler = require('../../roles/role-managers/active-chatters');

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "activeChatUserCount",
        description: "Get the number of active viewers in chat.",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async () => {
        logger.debug("Getting number of active viewers in chat.");

        let activeViewers = activeViewerHandler.getActiveChatters();

        if (activeViewers && activeViewers.length > 0) {
            return activeViewers.length;
        }

        return 0;
    }
};

module.exports = model;
