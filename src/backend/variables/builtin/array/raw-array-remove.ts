// Deprecated
import type { ReplaceVariable } from "../../../../types/variables";

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
        categories: ["advanced"],
        possibleDataOutput: ["text"],
        hidden: true
    },
    evaluator: arrayRemove.evaluator
};

export default model;