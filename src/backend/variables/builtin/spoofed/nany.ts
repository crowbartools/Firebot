import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "NANY",
        usage: "NANY[condition, condition, ...]",
        description: 'Returns true if all of the conditions return false',
        examples: [
            {
                usage: 'NANY[a === b, b === c]',
                description: "Returns true as a does not equal be and b does not equals c"
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.BOOLEAN],
        spoof: true
    }
};

export default model;