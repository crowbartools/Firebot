"use strict";
const chat = require('../../common/mixer-chat');
const util = require("../../utility");
const logger = require("../../logwrapper");

const model = {
    definition: {
        handle: "randomViewer",
        description: "Get a random viewer in chat."
    },
    evaluator: async () => {

        if (chat.getChatStatus()) {
            //return util.getRandomInt(internalMin, internalMax);
            logger.debug("Getting random viewer...");

            let currentViewers = await chat.getCurrentViewerList();

            if (currentViewers && currentViewers.length > 0) {
                let randIndex = util.getRandomInt(0, currentViewers.length - 1);
                return currentViewers[randIndex];
            }
        }
        return "[Unable to get random viewer]";
    }
};

module.exports = model;
