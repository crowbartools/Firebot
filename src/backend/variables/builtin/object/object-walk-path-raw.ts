import type { ReplaceVariable } from "../../../../types/variables";

import objectWalkPath from './object-walk-path';

const model : ReplaceVariable = {
    definition: {
        handle: "rawObjectWalkPath",
        description: "(Deprecated: use $objectWalkPath) Returns the value from a raw object at the given dot-notated path",
        usage: "rawObjectWalkPath[rawobject, path.to.value]",
        categories: ["advanced"],
        possibleDataOutput: ["text"],
        hidden: true
    },
    evaluator: objectWalkPath.evaluator
};

export default model;