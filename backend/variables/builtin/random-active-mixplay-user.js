"use strict";
const util = require("../../utility");
const logger = require("../../logwrapper");
const activeViewerHandler = require('../../roles/role-managers/active-mixplay-users');

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "randomActiveMixplayUser",
        description: "Get a random active mixplay user.",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async () => {
        logger.debug("Getting random active mixplay user...");

        let activeViewers = activeViewerHandler.getActiveMixplayUsers();

        if (activeViewers && activeViewers.length > 0) {
            let randIndex = util.getRandomInt(0, activeViewers.length - 1);
            return activeViewers[randIndex].username;
        }

        return "[Unable to get random active user]";
    }
};

module.exports = model;
