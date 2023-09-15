"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const logger = require("../../logwrapper");
const frontendCommunicator = require("../../common/frontend-communicator");
const { parseYoutubeId } = require("../../../shared/youtube-url-parser");

const model = {
    definition: {
        handle: "youtubeVideoDuration",
        usage: "youtubeVideoDuration[urlOrId]",
        description: "Attempts to retrieve youtube video duration.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, id) => {
        if (id == null) {
            return "[NO VIDEO ID PROVIDED]";
        }
        const result = await frontendCommunicator.fireEventAsync("getYoutubeVideoDuration", parseYoutubeId(id).id);

        if (isNaN(result)) {
            logger.error("Error while retrieving youtube video duration", result);
            return "[ERROR FETCHING DURATION]";
        }
        return result;
    }
};

module.exports = model;
