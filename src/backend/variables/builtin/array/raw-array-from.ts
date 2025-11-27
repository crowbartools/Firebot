import type { ReplaceVariable } from "../../../../types/variables";

import arrayFrom from './array-from';

const model : ReplaceVariable = {
    definition: {
        handle: "rawArrayFrom",
        description: "(Deprecated: use $arrayFrom) Returns a raw array containing the listed values",
        usage: "rawArrayFrom[value, value, ...]",
        categories: ["advanced"],
        possibleDataOutput: ["text"],
        hidden: true
    },
    evaluator: arrayFrom.evaluator
};

export default model;