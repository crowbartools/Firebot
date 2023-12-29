"use strict";

const fs = require("fs");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const logger = require("../../logwrapper");

const model = {
    definition: {
        handle: "fileExists",
        usage: 'fileExists[path\\to\\file.txt]',
        description: "Returns 'true' if a file exists, otherwise returns 'false'.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, filePath) => {

        if (filePath === null) {
            return "false";
        }

        try {
            return fs.existsSync(filePath) ? "true" : "false";
        } catch (err) {
            logger.error(`Error checking if file "${filePath}" exists`, err);
            return "false";
        }
    }
};

module.exports = model;
