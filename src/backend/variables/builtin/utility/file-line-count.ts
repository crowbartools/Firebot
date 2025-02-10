import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const fs = require("fs");
const logger = require("../../../logwrapper");

const model : ReplaceVariable = {
    definition: {
        handle: "fileLineCount",
        usage: "fileLineCount[\"path/to/file.txt\"]",
        description: "Count the number of lines in a text file.",
        categories: [VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER]
    },
    evaluator: (
        trigger: Trigger,
        filePath: string
    ) : number => {
        if (filePath === null || typeof filePath !== 'string') {
            logger.error(`Couldn't read file (${filePath}) to count the lines in it.`);
            return 0;
        }

        try {
            const contents = fs.readFileSync(filePath, { encoding: "utf8" });
            const lines = contents
                .split('\n')
                .filter((l : string) => l != null && l.trim() !== "");

            return lines.length;
        } catch (err) {
            logger.error("error counting lines in file", err);
            return 0;
        }
    }
};

export default model;
