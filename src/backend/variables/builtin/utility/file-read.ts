import fs from "fs/promises";

import type { ReplaceVariable, Trigger } from "../../../../types/variables";

import logger from "../../../logwrapper";
import { getRandomInt } from "../../../utils";

const model : ReplaceVariable = {
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
                usage: "readFile[path\\to\\file.txt, first]",
                description: "Read the first line from the file."
            },
            {
                usage: "readFile[path\\to\\file.txt, first, true]",
                description: "Removes leading, trailing, and empty lines before grabbing the first line"
            },
            {
                usage: "readFile[path\\to\\file.txt, last]",
                description: "Read the last line from the file."
            },
            {
                usage: "readFile[path\\to\\file.txt, last, true]",
                description: "Removes leading, trailing, and empty lines before grabbing the last line"
            },
            {
                usage: "readFile[path\\to\\file.txt, random]",
                description: "Read a random line from the file."
            },
            {
                usage: "readFile[path\\to\\file.txt, random, true]",
                description: "Removes leading, trailing, and empty lines before grabbing a random line"
            },
            {
                usage: "readFile[path\\to\\file.txt, array]",
                description: "Read contents of a text file as an array."
            },
            {
                usage: "readFile[path\\to\\file.txt, array, true]",
                description: "Removes leading, trailing, and empty lines before grabbing the array."
            },
            {
                usage: "readFile[path\\to\\file.ogg, bytes]",
                description: "Reads the content of a file and returns a byte array."
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["text", "array"]
    },
    evaluator: async (
        trigger: Trigger,
        filePath: string,
        lineOrRandom: null | number | "array" | "first" | "last" | "random" | "bytes",
        ignoreWhitespace?: string | boolean
    ) : Promise<string | string[] | Uint8Array> => {

        if (filePath === null) {
            return "[File Path Error]";
        }

        if (lineOrRandom === "bytes") {
            try {
                return Uint8Array.from(await fs.readFile(filePath));
            } catch (err) {
                logger.error("Error reading binary file", err);
                return "[Read File Error]";
            }
        }

        let contents : string;
        try {
            contents = await fs.readFile(filePath, { encoding: "utf-8" });
        } catch (err) {
            logger.error("error reading file", err);
            return "[Read File Error]";
        }

        if (lineOrRandom == null || contents === '') {
            return contents;
        }

        let lines : string[];
        if (ignoreWhitespace === true || `${ignoreWhitespace}`.toLowerCase() === 'true') {
            lines = contents

                // remove leading and trailing whitespace (EOLs, spaces, tabs, etc)
                .trim()

                // Split based on new lines, consuming all whitespace around the new line character.
                // This effectively removes empty lines, lines containing only spaces and
                // leading/trailing spaces from each line
                .split(/[ \t\f]*[\r\n]\s*/g);

        } else {
            lines = contents.split(/[\r\n]+/g);
        }

        if (Number.isFinite(Number(lineOrRandom))) {
            if (Number(lineOrRandom) <= lines.length) {
                return lines[Number(lineOrRandom) - 1];
            }
            return '';
        }

        const lorStr = `${lineOrRandom}`.toLowerCase();
        if (lorStr === 'array') {
            return lines;
        }
        if (lorStr === 'first') {
            return lines[0];
        }
        if (lorStr === 'last') {
            return lines[lines.length - 1];
        }
        if (lorStr === 'true' || lorStr === 'random') {
            return lines[getRandomInt(0, lines.length - 1)];
        }
        return '';
    }
};

export default model;
