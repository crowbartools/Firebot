import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "NAND",
        usage: "NAND[condition, condition, ...]",
        description: 'Returns true if any of the conditions return false',
        examples: [
            {
                usage: 'NAND[a === a, b === c]',
                description: "Returns true as b does not equals c"
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.BOOLEAN],
        spoof: true
    }
};

export default model;