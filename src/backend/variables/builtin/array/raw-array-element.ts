// Deprecated
import type { ReplaceVariable } from "../../../../types/variables";

import arrayElement from './array-element';

const model : ReplaceVariable = {
    definition: {
        handle: "rawArrayElement",
        description: "(Deprecated: use $arrayElement) Returns the element at the given index of the input raw array.",
        usage: "rawArrayElement[array, index]",
        categories: ["advanced"],
        possibleDataOutput: ["text", "number"],
        hidden: true
    },

    evaluator: arrayElement.evaluator
};

export default model;