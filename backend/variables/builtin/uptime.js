// Migration: done

"use strict";

const util = require("../../utility");

const { OutputDataType } = require("../../../shared/variable-constants");

const model = {
    definition: {
        handle: "uptime",
        description: "The current stream uptime",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async () => {
        return await util.getUptime();
    }
};

module.exports = model;
