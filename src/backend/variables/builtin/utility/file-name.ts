import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { basename, extname } from "path";

const model : ReplaceVariable = {
    definition: {
        handle: "fileName",
        usage: 'fileName[path\\to\\file.txt]',
        description: "Returns name of file without extension.",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: (
        trigger: Trigger,
        filePath?: string
    ) : string => {
        if (!filePath) {
            return "";
        }

        try {
            return basename(filePath, extname(filePath));
        } catch (err) {
            // Probably a directory or invalid filename
            return "[Invalid File Path]";
        }
    }
};

export default model;
