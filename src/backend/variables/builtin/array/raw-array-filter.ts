import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import arrayFilter from './array-filter';

const model : ReplaceVariable = {
    definition: {
        handle: "rawArrayFilter",
        description: "(Deprecated: use $arrayFilter) Returns a new filtered raw array.",
        usage: "rawArrayFilter[rawArray, matcher, propertyPath, removeMatches]",
        examples: [
            {
                usage: 'rawArrayFilter[rawArray, 1, null, false]',
                description: "Filter out anything that doesn't equal 1"
            },
            {
                usage: 'rawArrayFilter[rawArray, 1, null, true]',
                description: 'Filter out anything that equals 1'
            },
            {
                usage: 'rawArrayFilter[rawArray, value, key, true]',
                description: 'Filter out any item in the array that has a key property which equals "value"'
            }
        ],

        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT],
        hidden: true
    },
    evaluator: arrayFilter.evaluator
};

export default model;