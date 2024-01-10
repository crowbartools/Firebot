import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

const model : ReplaceVariable = {
    definition: {
        handle: "AND",
        usage: "AND[condition, condition, ...]",
        description: 'Returns true if all of the conditions are true. Only works within $if[]',
        examples: [
            {
                usage: 'AND[a === a, b === b]',
                description: "Returns true as a equals a and b equals b"
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.BOOLEAN],
        spoof: true
    }
};

export default model;