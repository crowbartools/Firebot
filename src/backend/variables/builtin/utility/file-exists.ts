import fs from "fs";
import type { ReplaceVariable, Trigger } from "../../../../types/variables";
import logger from "../../../logwrapper";

const model : ReplaceVariable = {
    definition: {
        handle: "fileExists",
        usage: 'fileExists[path\\to\\file.txt]',
        description: "Returns true if a file exists, otherwise returns false.",
        categories: ["advanced"],
        possibleDataOutput: ["text"]
    },
    evaluator: (
        trigger: Trigger,
        filePath: string
    ) : boolean => {

        if (filePath == null) {
            return false;
        }

        try {
            return fs.existsSync(filePath) ? true : false;
        } catch (err) {
            logger.error(`Error checking if file "${filePath}" exists`, err);
            return false;
        }
    }
};

export default model;
