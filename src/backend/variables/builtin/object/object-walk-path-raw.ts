import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import objectWalkPath from './object-walk-path';

const model : ReplaceVariable = {
    definition: {
        handle: "rawObjectWalkPath",
        description: "(Deprecated: use $objectWalkPath) Returns the value from a raw object at the given dot-notated path",
        usage: "rawObjectWalkPath[rawobject, path.to.value]",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT],
        hidden: true
    },
    evaluator: objectWalkPath.evaluator
};

export default model;