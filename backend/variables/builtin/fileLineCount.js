"use strict";

const fs = require("fs");

const { OutputDataType } = require("../../../shared/variable-contants");

const logger = require("../../logwrapper");

const model = {
    definition: {
        handle: "fileLineCount",
        usage: "fileLineCount[\"path/to/file.txt\"]",
        description: "Count the number of lines in a text file.",
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (_, filePath) => {
        if (filePath === null || !filePath.endsWith(".txt")) return 0;

        try {
            let contents = fs.readFileSync(filePath, "utf8");
            let lines = contents.split('\n');
            let filteredLines = lines.filter(function (line) {
                if (line != null && line.trim() !== "") {
                    return line;
                }
            });
            return filteredLines.length;
        } catch (err) {
            logger.error("error counting lines in file", err);
            return 0;
        }
    }
};

module.exports = model;
