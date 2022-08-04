// Migration: todo - Need implentation info related to viewer list

"use strict";
const util = require("../../utility");
const logger = require("../../logwrapper");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const twitchChat = require("../../chat/twitch-chat");

const model = {
    definition: {
        handle: "randomViewer",
        description: "Get a random viewer in chat.",
        categories: [VariableCategory.USER],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async () => {

        //return util.getRandomInt(internalMin, internalMax);
        logger.debug("Getting random viewer...");

        const currentViewers = await twitchChat.getViewerList();

        if (currentViewers && currentViewers.length > 0) {
            const randIndex = util.getRandomInt(0, currentViewers.length - 1);
            return currentViewers[randIndex].username;
        }

        return "[Unable to get random viewer]";
    }
};

module.exports = model;
