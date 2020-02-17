"use strict";
const logger = require("../../logwrapper");
const activeViewerHandler = require('../../roles/role-managers/active-mixplay-users');

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "activeMixplayUserCount",
        description: "Get the number of active mixplay users.",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async () => {
        logger.debug("Getting number of active mixplay users.");

        let activeViewers = activeViewerHandler.getActiveMixplayUsers();

        if (activeViewers && activeViewers.length > 0) {
            return activeViewers.length;
        }

        return 0;
    }
};

module.exports = model;
