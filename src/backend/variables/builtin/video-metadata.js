"use strict";

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const frontendCommunicator = require("../../common/frontend-communicator");

const model = {
    definition: {
        handle: "videoMetadata",
        usage: "videoMetadata[filePathOrUrl]",
        description: "Attempts to retrieve video metadata.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: async (trigger, url) => {
        if (url == null) {
            return "[NO URL PROVIDED]";
        }
        try {
            return JSON.stringify(await frontendCommunicator.fireEventAsync("getVideoMetadata", {url: url}));
        } catch (err) {
            return "[ERROR FETCHING METADATA]";
        }
    }
};

module.exports = model;
