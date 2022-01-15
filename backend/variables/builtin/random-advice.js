// Migration: done

"use strict";

const apiProcessor = require("../../common/handlers/apiProcessor");
const { OutputDataType } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "randomAdvice",
        usage: "randomAdvice",
        description: "Get some random advice!",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: () => {
        return apiProcessor.getApiResponse("Advice");
    }
};

module.exports = model;
