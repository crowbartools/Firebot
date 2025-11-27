// Deprecated
import type { ReplaceVariable } from "../../../../types/variables";

import arrayAdd from './array-add';

const model : ReplaceVariable = {
    definition: {
        handle: 'rawArrayAdd',
        description: '(Deprecated: use $arrayAdd) Returns a new array with the added element',
        usage: 'rawArrayAdd[array, new-item, at-start]',
        examples: [
            {
                usage: 'rawArrayAdd[array, 4]',
                description: 'Returns a new array with 4 added to the end of the raw array'
            },
            {
                usage: 'rawArrayAdd[array, 4, true]',
                description: 'Returns a new array with 4 added to the start of the raw array'
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["text"],
        hidden: true
    },

    evaluator: arrayAdd.evaluator
};

export default model;