// Deprecated
import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import arrayFind from './array-find';

const model : ReplaceVariable = {
    definition: {
        handle: "rawArrayFind",
        description: "(Deprecated: use $arrayFind) Finds a matching element in the array or null",
        usage: "rawArrayFind[array, matcher, propertyPath]",
        examples: [
            {
                usage: 'rawArrayFind[array, value]',
                description: 'Searches each item in the array for "value" and returns the first matched item'
            },
            {
                usage: 'rawArrayFind[array, value, key]',
                description: 'Searches each item in the array for an item that has a "key" property that equals "value"'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER],
        hidden: true
    },

    evaluator: arrayFind.evaluator
};

export default model;