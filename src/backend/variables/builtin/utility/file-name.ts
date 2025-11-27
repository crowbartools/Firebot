import { basename, extname } from "path";
import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "fileName",
        usage: 'fileName[path\\to\\file.txt]',
        description: "Returns name of file without extension.",
        categories: ["advanced"],
        possibleDataOutput: ["text"]
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
        } catch {
            // Probably a directory or invalid filename
            return "[Invalid File Path]";
        }
    }
};

export default model;
