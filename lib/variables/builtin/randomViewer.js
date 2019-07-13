"use strict";
const channelAccess = require("../../common/channel-access");
const util = require("../../utility");
const logger = require("../../logwrapper");

const { OutputDataType } = require("../../../shared/variable-contants");

const model = {
    definition: {
        handle: "randomViewer",
        description: "Get a random viewer in chat.",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async () => {

        //return util.getRandomInt(internalMin, internalMax);
        logger.debug("Getting random viewer...");

        let currentViewers = await channelAccess.getCurrentViewerList();

        if (currentViewers && currentViewers.length > 0) {
            let randIndex = util.getRandomInt(0, currentViewers.length - 1);
            return currentViewers[randIndex].username;
        }

        return "[Unable to get random viewer]";
    }
};

module.exports = model;
