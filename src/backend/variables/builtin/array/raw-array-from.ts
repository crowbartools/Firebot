import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import arrayFrom from './array-from';

const model : ReplaceVariable = {
    definition: {
        handle: "rawArrayFrom",
        description: "(Deprecated: use $arrayFrom) Returns a raw array containing the listed values",
        usage: "rawArrayFrom[value, value, ...]",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT],
        hidden: true
    },
    evaluator: arrayFrom.evaluator
};

export default model;