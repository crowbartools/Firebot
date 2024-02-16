// Deprecated
import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import arrayFindIndex from './array-find-index';

const model : ReplaceVariable = {
    definition: {
        handle: "rawArrayFindIndex",
        description: "(Deprecated: use $arrayFindIndex) Finds a matching element in the array and returns it's index, or null if the element is absent",
        usage: "rawArrayFindIndex[array, matcher, propertyPath]",

        examples: [
            {
                usage: 'rawArrayFindIndex[array, b]',
                description: 'Returns 1, the index of "b"'
            },
            {
                usage: 'rawArrayFindIndex[array, value, key]',
                description: 'Searches the array for an item with a key with the value of "value"'
            }
        ],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER],
        hidden: true
    },
    evaluator: arrayFindIndex.evaluator
};
export default model;