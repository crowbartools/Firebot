// Deprecated
import type { ReplaceVariable } from "../../../../types/variables";

import arrayJoin from './array-join';

const model : ReplaceVariable = {
    definition: {
        handle: "rawArrayJoin",
        description: "(Deprecated: use $arrayJoin) Returns a string with each array item joined together with the given separator",
        usage: "rawArrayJoin[array, separator]",
        categories: ["advanced"],
        possibleDataOutput: ["text"],
        hidden: true
    },
    evaluator: arrayJoin.evaluator
};

export default model;