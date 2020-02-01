"use strict";

const fs = require("fs");

const util = require("../../utility");

const { OutputDataType } = require("../../../shared/variable-contants");

const logger = require("../../logwrapper");

const model = {
    definition: {
        handle: "readFile",
        usage: "readFile[\"path/to/file.txt\"]",
        description: "Read contents of a text file. Optionally include 'true' as a second argument to select a random line, or a number to read a specific line.",
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, filePath, randomLine) => {

        if (filePath === null || !filePath.endsWith(".txt")) return "[File Path Error]";
        try {
            let contents = fs.readFileSync(filePath, "utf8");
            let filteredLines = [];

            if (randomLine === "true" || !isNaN(randomLine)) {
                let lines = contents.replace(/\r\n/g, "\n").split("\n");
                filteredLines = lines.filter(function (line) {
                    if (line != null && line.trim() !== "") {
                        return line;
                    }
                });
            }

            // Get line at random.
            if (randomLine === "true") {
                let randIndex = util.getRandomInt(0, filteredLines.length - 1);
                return filteredLines[randIndex];
            }

            if (!isNaN(randomLine)) {
                randomLine = randomLine - 1;
                return filteredLines[randomLine];
            }

            return contents;
        } catch (err) {
            logger.error("error reading file", err);
            return "[Read File Error]";
        }
    }
};

module.exports = model;
