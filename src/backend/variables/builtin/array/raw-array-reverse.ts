// Deprecated
import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import arrayReverse from './array-reverse';

const model : ReplaceVariable = {
    definition: {
        handle: "rawArrayReverse",
        description: "(Deprecated: use $arrayReverse) Returns a new shuffled array",
        usage: "rawArrayReverse[array]",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT],
        hidden: true
    },
    evaluator: arrayReverse.evaluator
};

export default model;