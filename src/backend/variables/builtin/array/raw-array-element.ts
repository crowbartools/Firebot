// Deprecated
import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import arrayElement from './array-element';

const model : ReplaceVariable = {
    definition: {
        handle: "rawArrayElement",
        description: "(Deprecated: use $arrayElement) Returns the element at the given index of the input raw array.",
        usage: "rawArrayElement[array, index]",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT, OutputDataType.NUMBER],
        hidden: true
    },

    evaluator: arrayElement.evaluator
};

export default model;