// Deprecated
import type { ReplaceVariable } from "../../../../types/variables";

import arrayLength from './array-length';

const model : ReplaceVariable = {
    definition: {
        handle: "rawArrayLength",
        description: "(Deprecated: use $arrayLength) Returns the length of the input array.",
        usage: "rawArrayLength[array]",
        categories: ["advanced", "numbers"],
        possibleDataOutput: ["number"],
        hidden: true
    },
    evaluator: arrayLength.evaluator
};

export default model;