import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const fs = require("fs");
const util = require("../../../utility");
const logger = require("../../../logwrapper");

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
                description: "Read the last line from the file."
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
    evaluator: (
        trigger: Trigger,
        filePath: string,
        lineOrRandom: null | number | "first" | "last" | "random"
    ) : string => {

        if (filePath === null) {
            return "[File Path Error]";
        }

        let contents : string;
        try {
            contents = fs.readFileSync(filePath, { encoding: "utf8" });
        } catch (err) {
            logger.error("error reading file", err);
            return "[Read File Error]";
        }

        if (lineOrRandom == null || contents === '') {
            return contents;
        }

        const lines = contents.split(/[\r\n]+/g);
        if (Number.isFinite(Number(lineOrRandom))) {
            if (Number(lineOrRandom) <= lines.length) {
                return lines[Number(lineOrRandom) - 1];
            }
            return '';
        }

        const lorStr = `${lineOrRandom}`.toLowerCase();
        if (lorStr === 'first') {
            return lines[0];
        }
        if (lorStr === 'last') {
            return lines[lines.length - 1];
        }
        if (lorStr === 'true' || lorStr === 'random') {
            return lines[util.getRandomInt(0, lines.length - 1)];
        }
        return '';
    }
};

export default model;
