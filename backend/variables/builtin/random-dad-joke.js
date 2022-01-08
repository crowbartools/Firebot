// Migration: done

"use strict";

const apiProcessor = require("../../common/handlers/apiProcessor");
const { OutputDataType } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "randomDadJoke",
        usage: "randomDadJoke",
        description: "Get a random dad joke!",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: () => {
        return apiProcessor.getApiResponse("Dad Joke");
    }
};

module.exports = model;
