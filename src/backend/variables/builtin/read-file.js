// Migration: done

"use strict";

const fs = require("fs");

const util = require("../../utility");

const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");

const logger = require("../../logwrapper");

const model = {
    definition: {
        handle: "readFile",
        usage: 'readFile[path\\to\\file.txt]',
        description: "Read contents of a text file.",
        examples: [
            {
                usage: "readFile[path\\to\\file.txt, 1]",
                description: "Read a specific line number from the file."
            },
            {
                usage: "readFile[path\\to\\file.txt, last]",
                description: "Read the last line from the file."
            },
            {
                usage: "readFile[path\\to\\file.txt, random]",
                description: "Read a random line from the file."
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (_, filePath, lineOrRandom) => {

        if (filePath === null) {
            return "[File Path Error]";
        }

        try {
            const contents = fs.readFileSync(filePath, { encoding: "utf8" });
            let lines = [];

            let readLine = false;
            let lineToRead = -1;
            if (lineOrRandom != null) {
                lines = contents.replace(/\r\n/g, "\n")
                    .split("\n")
                    .filter(l => l != null && l.trim() !== "");

                if (!isNaN(lineOrRandom)) {
                    lineToRead = parseInt(lineOrRandom - 1);
                    if (lineToRead < 0) {
                        lineToRead = 0;
                    }
                    readLine = true;
                } else if (lineOrRandom === true || lineOrRandom.toLowerCase() === "true" || lineOrRandom.toLowerCase() === "random") {
                    lineToRead = util.getRandomInt(0, lines.length - 1);
                    readLine = true;
                } else if (lineOrRandom.toLowerCase() === "last") {
                    lineToRead = lines.length - 1;
                    readLine = true;
                }
            }

            if (readLine) {
                if (lineToRead < lines.length) {
                    return lines[lineToRead] || "";
                }
                return "";
            }
            return contents;
        } catch (err) {
            logger.error("error reading file", err);
            return "[Read File Error]";
        }
    }
};

module.exports = model;
