"use strict";

const fs = require("fs");

const util = require("../../utility");

const { OutputDataType } = require("../../../shared/variable-contants");

const logger = require("../../logwrapper");

const model = {
    definition: {
        handle: "readFile",
        usage: "readFile[\"path/to/file.txt\"]",
        description: "Read contents of a text file. Optionally include 'true' as a second argument to select a random line.",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, filePath, randomLine) => {

        if (filePath === null || !filePath.endsWith(".txt")) return "[File Path Error]";
        try {
            let contents = fs.readFileSync(filePath, "utf8");
            if (randomLine) {
                let lines = contents.replace(/\r\n/g, "\n").split("\n");
                let randIndex = util.getRandomInt(0, lines.length - 1);
                return lines[randIndex];
            }
            return contents;
        } catch (err) {
            logger.error("error reading file", err);
            return "[Read File Error]";
        }
    }
};

module.exports = model;
