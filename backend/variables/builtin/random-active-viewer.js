"use strict";
const util = require("../../utility");
const logger = require("../../logwrapper");
const activeViewerHandler = require('../../roles/role-managers/active-chatters');

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "randomActiveViewer",
        description: "Get a random active viewer in chat.",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async () => {

        //return util.getRandomInt(internalMin, internalMax);
        logger.debug("Getting random active viewer...");

        let activeViewers = activeViewerHandler.getActiveChatters();

        if (activeViewers && activeViewers.length > 0) {
            let randIndex = util.getRandomInt(0, activeViewers.length - 1);
            return activeViewers[randIndex].username;
        }

        return "[Unable to get random active viewer]";
    }
};

module.exports = model;
