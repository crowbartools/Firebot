"use strict";
const mixplay = require("../../interactive/mixplay");
const util = require("../../utility");
const logger = require("../../logwrapper");

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "randomMixplayUser",
        description: "Get a random mixplay user.",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async () => {
        logger.debug("Getting random mixplay user...");

        let currentUsers = mixplay.getConnectedUsernames();

        if (currentUsers && currentUsers.length > 0) {
            let randIndex = util.getRandomInt(0, currentUsers.length - 1);
            return currentUsers[randIndex];
        }

        return "[Unable to get random mixplay user]";
    }
};

module.exports = model;
