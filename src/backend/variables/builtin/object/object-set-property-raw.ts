import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import objectSetProperty from './object-set-property';

const model : ReplaceVariable = {
    definition: {
        handle: "rawSetObjectProperty",
        description: "(Deprecated: use $setObjectProperty) Adds or updates a property's value in the raw object. For nested properties, you can use dot notation (e.g. some.property). Set value to null to remove property.",
        usage: "rawSetObjectProperty[object, propertyPath, value]",
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT],
        hidden: true
    },
    evaluator: objectSetProperty.evaluator
};
export default model;