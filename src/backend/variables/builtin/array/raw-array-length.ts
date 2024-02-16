// Deprecated
import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import arrayLength from './array-length';

const model : ReplaceVariable = {
    definition: {
        handle: "rawArrayLength",
        description: "(Deprecated: use $arrayLength) Returns the length of the input array.",
        usage: "rawArrayLength[array]",
        categories: [VariableCategory.ADVANCED, VariableCategory.NUMBERS],
        possibleDataOutput: [OutputDataType.NUMBER],
        hidden: true
    },
    evaluator: arrayLength.evaluator
};

export default model;