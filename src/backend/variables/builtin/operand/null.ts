import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "null",
        description: "Returns a literal null value; Useful in comparisons such as in $if[]",
        usage: "null",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.NULL]
    },
    evaluator: () => null
};
export default model;