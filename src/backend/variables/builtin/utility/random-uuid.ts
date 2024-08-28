import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";
import { randomUUID } from "crypto";

const model : ReplaceVariable = {
    definition: {
        handle: "randomUUID",
        usage: "randomUUID",
        description: "Returns a random formated UUID eg 00000000-0000-0000-0000-000000000000",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: () => {
        return randomUUID();
    }
};

export default model;
