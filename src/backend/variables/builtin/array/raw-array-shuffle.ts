// Deprecated
import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import arrayShuffle from './array-shuffle';

const model : ReplaceVariable = {
    definition: {
        handle: "rawArrayShuffle",
        description: "(Deprecated: use $arrayShuffle) Returns a new shuffled array",
        usage: "rawArrayShuffle[array]",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT],
        hidden: true
    },
    evaluator: arrayShuffle.evaluator
};

export default model;