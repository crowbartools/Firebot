import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "NALL",
        usage: "NALL[condition, condition, ...]",
        description: 'Returns true if any of the conditions return false',
        examples: [
            {
                usage: 'NALL[a === a, b === c]',
                description: "Returns true as b does not equals c"
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.BOOLEAN],
        spoof: true
    }
};

export default model;