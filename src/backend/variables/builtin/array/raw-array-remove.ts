// Deprecated
import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import arrayRemove from "./array-remove";

const model : ReplaceVariable = {
    definition: {
        handle: "rawArrayRemove",
        description: "(Deprecated: use $arrayRemove) Returns a new array with the element at the given index removed",
        usage: "rawArrayRemove[array, index]",
        examples: [
            {
                usage: 'rawArrayRemove[array, 0]',
                description: "Removes the element at the 0 index"
            },
            {
                usage: 'rawArrayRemove[array, last]',
                description: 'Removes the element at the last index'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT],
        hidden: true
    },
    evaluator: arrayRemove.evaluator
};

export default model;