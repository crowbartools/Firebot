import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "false",
        description: "Returns a literal false boolean value; Useful in comparisons such as in $if[]",
        usage: "false",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.BOOLEAN]
    },
    evaluator: () => false
};
export default model;