// Deprecated
import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import arrayJoin from './array-join';

const model : ReplaceVariable = {
    definition: {
        handle: "rawArrayJoin",
        description: "(Deprecated: use $arrayJoin) Returns a string with each array item joined together with the given separator",
        usage: "rawArrayJoin[array, separator]",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT],
        hidden: true
    },
    evaluator: arrayJoin.evaluator
};

export default model;