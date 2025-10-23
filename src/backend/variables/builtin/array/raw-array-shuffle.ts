// Deprecated
import type { ReplaceVariable } from "../../../../types/variables";

import arrayShuffle from './array-shuffle';

const model : ReplaceVariable = {
    definition: {
        handle: "rawArrayShuffle",
        description: "(Deprecated: use $arrayShuffle) Returns a new shuffled array",
        usage: "rawArrayShuffle[array]",
        categories: ["advanced"],
        possibleDataOutput: ["text"],
        hidden: true
    },
    evaluator: arrayShuffle.evaluator
};

export default model;