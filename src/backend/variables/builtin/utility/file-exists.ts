import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import fs from "fs";
import logger from "../../../logwrapper";

const model : ReplaceVariable = {
    definition: {
        handle: "fileExists",
        usage: 'fileExists[path\\to\\file.txt]',
        description: "Returns true if a file exists, otherwise returns false.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
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
