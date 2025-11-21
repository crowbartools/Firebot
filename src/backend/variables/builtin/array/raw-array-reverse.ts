// Deprecated
import type { ReplaceVariable } from "../../../../types/variables";

import arrayReverse from './array-reverse';

const model : ReplaceVariable = {
    definition: {
        handle: "rawArrayReverse",
        description: "(Deprecated: use $arrayReverse) Returns a new shuffled array",
        usage: "rawArrayReverse[array]",
        categories: ["advanced"],
        possibleDataOutput: ["text"],
        hidden: true
    },
    evaluator: arrayReverse.evaluator
};

export default model;