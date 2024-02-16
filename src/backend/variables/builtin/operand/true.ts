import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "true",
        description: "Returns a literal true boolean value; Useful in comparisons such as in $if[]",
        usage: "true",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.BOOLEAN]
    },
    evaluator: () => true
};
export default model;